"use client";

import { useSyncExternalStore } from "react";

// GenLayer Studio Network is a shared sandbox with a small, fixed execution
// pool (currently 8 slots). Firing every contract read/write the moment a
// page wants it can blow past that pool the instant two or three vault
// pages are open, producing "Server busy: all N execution slots occupied"
// errors that have nothing to do with contract correctness. This module
// gives every RPC call in the app two protections: a concurrency cap so we
// never flood the pool ourselves, and retry-with-backoff so a transient
// busy response is invisible to the caller instead of surfacing as a crash.

const MAX_CONCURRENT_RPC_CALLS = 3;
const MAX_RETRIES = 6;
const BASE_DELAY_MS = 1500;
const MAX_DELAY_MS = 20_000;

const BUSY_PATTERNS = [
  /server busy/i,
  /execution slots? occupied/i,
  /retry later/i,
  /too many requests/i,
  /rate limit/i,
];

function isBusyError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return BUSY_PATTERNS.some((pattern) => pattern.test(message));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Global busy status, exposed to the UI via a tiny pub-sub ───────────────

export interface RpcStatus {
  busy: boolean;
  attempt: number;
  maxRetries: number;
  message: string;
}

const IDLE_STATUS: RpcStatus = { busy: false, attempt: 0, maxRetries: MAX_RETRIES, message: "" };

let currentStatus: RpcStatus = IDLE_STATUS;
let inFlightBusyCalls = 0;
const listeners = new Set<() => void>();

function setStatus(next: RpcStatus): void {
  currentStatus = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): RpcStatus {
  return currentStatus;
}

/** Subscribable "GenLayer network busy" indicator for banners/toasts. */
export function useRpcStatus(): RpcStatus {
  return useSyncExternalStore(subscribe, getSnapshot, () => IDLE_STATUS);
}

// ── Retry with exponential backoff + jitter ─────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      const result = await fn();
      if (inFlightBusyCalls === 0) setStatus(IDLE_STATUS);
      return result;
    } catch (err) {
      if (!isBusyError(err) || attempt >= MAX_RETRIES) {
        throw err;
      }
      attempt += 1;
      inFlightBusyCalls += 1;
      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
      const jitter = delay * (0.75 + Math.random() * 0.5);
      setStatus({
        busy: true,
        attempt,
        maxRetries: MAX_RETRIES,
        message: `GenLayer network busy — retrying (${attempt}/${MAX_RETRIES})...`,
      });
      await sleep(jitter);
      inFlightBusyCalls -= 1;
    }
  }
}

// ── Concurrency limiter ──────────────────────────────────────────────────

let activeCalls = 0;
const waitQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeCalls < MAX_CONCURRENT_RPC_CALLS) {
    activeCalls += 1;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  activeCalls += 1;
}

function releaseSlot(): void {
  activeCalls -= 1;
  const next = waitQueue.shift();
  if (next) next();
}

/**
 * Runs an RPC call through a shared concurrency cap and busy-retry wrapper.
 * Use this for every gen_call / transaction call so the app self-limits
 * against the Studio Network's fixed execution pool instead of relying on
 * every caller to remember to throttle itself.
 */
export async function queuedRpcCall<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await withRetry(fn);
  } finally {
    releaseSlot();
  }
}

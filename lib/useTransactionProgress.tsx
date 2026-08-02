"use client";

import { useEffect, useRef, useState } from "react";
import { fetchTransactionStatusName } from "./contract";

const DECIDED_STATES = new Set([
  "ACCEPTED",
  "UNDETERMINED",
  "LEADER_TIMEOUT",
  "VALIDATORS_TIMEOUT",
  "CANCELED",
  "FINALIZED",
]);

export interface TransactionProgress {
  statusName: string | null;
  elapsedSeconds: number;
}

/**
 * Polls a pending transaction's real GenLayer consensus stage
 * (PROPOSING/COMMITTING/REVEALING/ACCEPTED/...) and tracks elapsed time,
 * purely for progress display. Stops polling once a decided state is
 * reached, or when txHash is cleared.
 */
export function useTransactionProgress(txHash: string | null): TransactionProgress {
  const [statusName, setStatusName] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!txHash) return;

    startRef.current = Date.now();
    let cancelled = false;

    const tick = setInterval(() => {
      if (startRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 1000);

    async function poll() {
      if (cancelled) return;
      const status = await fetchTransactionStatusName(txHash as string);
      if (cancelled) return;
      if (status) setStatusName(status);
      if (status && DECIDED_STATES.has(status)) return;
      setTimeout(poll, 3000);
    }
    poll();

    return () => {
      cancelled = true;
      clearInterval(tick);
      startRef.current = null;
      setStatusName(null);
      setElapsedSeconds(0);
    };
  }, [txHash]);

  return { statusName, elapsedSeconds };
}

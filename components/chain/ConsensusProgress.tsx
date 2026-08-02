"use client";

import { useTransactionProgress } from "@/lib/useTransactionProgress";
import { explorerTxUrl } from "@/lib/constants";
import { truncateHash } from "@/lib/formatters";

const STAGES = ["PROPOSING", "COMMITTING", "REVEALING", "ACCEPTED"] as const;

const STAGE_LABELS: Record<string, string> = {
  PENDING: "Submitted, awaiting a validator leader",
  PROPOSING: "Leader is proposing a result",
  COMMITTING: "Validators are committing votes",
  REVEALING: "Validators are revealing votes",
  ACCEPTED: "Consensus reached — pending finalization",
  FINALIZED: "Finalized",
  UNDETERMINED: "Validators could not agree — nothing was written",
  VALIDATORS_TIMEOUT: "Validators timed out — retryable",
  LEADER_TIMEOUT: "Leader timed out — retryable",
  CANCELED: "Canceled",
};

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Surfaces the real GenLayer consensus lifecycle for a pending write,
 * instead of a generic spinner: elapsed time, current stage, an explorer
 * link available immediately (not only after completion), and an explicit
 * note distinguishing ACCEPTED (still inside the appeal window) from
 * FINALIZED. Renders nothing once no transaction is pending.
 */
export function ConsensusProgress({ txHash }: { txHash: string | null }) {
  const { statusName, elapsedSeconds } = useTransactionProgress(txHash);

  if (!txHash) return null;

  const stageIndex = statusName ? STAGES.indexOf(statusName as (typeof STAGES)[number]) : -1;
  const label = statusName ? STAGE_LABELS[statusName] ?? statusName : "Waiting for the network to pick this up";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-2 border border-gold/15 bg-obsidian/60 rounded-sm px-4 py-3"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-gold-2">
          {label}
        </span>
        <span className="font-mono text-[0.625rem] text-dust">
          {formatElapsed(elapsedSeconds)} elapsed
        </span>
      </div>

      {stageIndex >= 0 && (
        <div className="flex items-center gap-1.5" aria-hidden>
          {STAGES.map((stage, i) => (
            <span
              key={stage}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stageIndex ? "bg-gold-2" : "bg-parchment/10"
              }`}
            />
          ))}
        </div>
      )}

      {statusName === "ACCEPTED" && (
        <p className="font-serif italic text-xs text-dust">
          Accepted by consensus. This result can still change during the
          appeal window before it finalizes.
        </p>
      )}

      <a
        href={explorerTxUrl(txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[0.625rem] text-dust hover:text-gold-2 transition-colors self-start"
      >
        Watch on GenLayer Explorer · {truncateHash(txHash)} ↗
      </a>
    </div>
  );
}

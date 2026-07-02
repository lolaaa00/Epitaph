"use client";

import { useState } from "react";
import { useWallet } from "@/lib/useWallet";
import { resolveFracture } from "@/lib/contract";
import type { FractureRecord } from "@/lib/formatters";
import { TxHashLink } from "@/components/chain/TxHashLink";
import { truncateHash } from "@/lib/formatters";

export function FractureCard({
  fracture,
  onResolved,
}: {
  fracture: FractureRecord;
  onResolved?: () => void;
}) {
  const { address, connect } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const canResolve = fracture.status === "OPEN" || fracture.status === "UNDER_REVIEW";

  async function handleResolve() {
    setError(null);
    if (!address) {
      await connect();
      return;
    }
    try {
      setBusy(true);
      const result = await resolveFracture(fracture.fractureId);
      setTxHash(result.txHash);
      onResolved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve fracture.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-rust-2/[0.04] border border-rust-2/20 rounded-sm px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[0.575rem] uppercase tracking-[0.18em] text-rust-2">
          {fracture.fractureType.replace(/_/g, " ")} · {fracture.status}
        </span>
        <span className="font-mono text-[0.6rem] text-dust">{fracture.fractureId}</span>
      </div>
      <p className="font-serif text-[0.9375rem] text-parchment leading-relaxed mb-2">
        {fracture.claim}
      </p>
      <div className="font-mono text-[0.625rem] text-dust mb-3">
        target: {fracture.targetType} · {fracture.targetId} · opened by{" "}
        {truncateHash(fracture.openedBy)}
      </div>

      {fracture.evidenceRef && (
        <div className="font-mono text-[0.6rem] text-dust mb-3 opacity-70 truncate">
          evidence_ref: {fracture.evidenceRef}
        </div>
      )}

      {fracture.status === "RESOLVED" && (
        <div className="border-t border-rust-2/15 pt-3 mt-2">
          <div className="font-mono text-[0.575rem] uppercase tracking-[0.14em] text-blue-2 mb-1">
            Resolution: {fracture.resolution.replace(/_/g, " ")}
          </div>
          <p className="font-serif italic text-sm text-parchment">{fracture.resolutionSummary}</p>
        </div>
      )}

      {canResolve && (
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={handleResolve}
            disabled={busy}
            className="btn-explore self-start text-sm py-2 px-5 disabled:opacity-50"
          >
            {address ? (busy ? "Validators adjudicating…" : "Resolve via Consensus") : "Connect Wallet"}
          </button>
          {error && <p className="font-mono text-xs text-rust-2">{error}</p>}
          {txHash && <TxHashLink hash={txHash} label="Resolved ·" />}
        </div>
      )}
    </div>
  );
}

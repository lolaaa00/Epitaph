"use client";

import { useState } from "react";
import { useWallet } from "@/lib/useWallet";
import { requestLegacyInscription } from "@/lib/contract";
import type { LegacyVault, LegacyInscription as LegacyInscriptionT } from "@/lib/formatters";
import { LegacyInscription } from "./LegacyInscription";
import { TxHashLink } from "@/components/chain/TxHashLink";
import { ConsensusProgress } from "@/components/chain/ConsensusProgress";

export function ConsensusInscription({
  vault,
  inscription,
  onRequested,
}: {
  vault: LegacyVault;
  inscription: LegacyInscriptionT | null;
  onRequested?: () => void;
}) {
  const { address, connect } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [pendingHash, setPendingHash] = useState<string | null>(null);

  const canRequest =
    !vault.sealed &&
    vault.state !== "SEALED" &&
    vault.evidenceCount > 0 &&
    vault.state !== "AWAITING_CONSENSUS";

  async function handleRequest() {
    setError(null);
    if (!address) {
      await connect();
      return;
    }
    try {
      setBusy(true);
      setPendingHash(null);
      const result = await requestLegacyInscription(vault.vaultId, (hash) => setPendingHash(hash));
      setTxHash(result.txHash);
      onRequested?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Consensus request failed.");
    } finally {
      setBusy(false);
      setPendingHash(null);
    }
  }

  const divergence =
    vault.state === "UNDETERMINED"
      ? "major divergence"
      : vault.state === "DISPUTED"
      ? "minor divergence"
      : vault.state === "AWAITING_CONSENSUS"
      ? "deliberating"
      : "aligned";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-dust">
          Interpretation Drift ·{" "}
          <span
            className={
              divergence === "aligned"
                ? "text-verdigris"
                : divergence === "deliberating"
                ? "text-blue-2"
                : "text-rust-2"
            }
          >
            {divergence}
          </span>
        </div>
        {canRequest && (
          <button onClick={handleRequest} disabled={busy} className="btn-archive disabled:opacity-50">
            {busy ? "Validators deliberating…" : "Request Legacy Inscription"}
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="font-mono text-xs text-rust-2 border border-rust-2/30 bg-rust-2/5 rounded-sm px-3 py-2"
        >
          {error}
        </p>
      )}

      {busy && <ConsensusProgress txHash={pendingHash} />}
      {!busy && txHash && <TxHashLink hash={txHash} label="Consensus Requested ·" />}

      <LegacyInscription inscription={inscription} />
    </div>
  );
}

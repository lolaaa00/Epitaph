"use client";

import { useState } from "react";
import { useWallet } from "@/lib/useWallet";
import { submitEvidence } from "@/lib/contract";
import { validateEvidence, slugifyId } from "@/lib/validation";
import { EVIDENCE_TYPES } from "@/lib/constants";
import { TxHashLink } from "@/components/chain/TxHashLink";

export function EvidenceForm({
  vaultId,
  onSubmitted,
}: {
  vaultId: string;
  onSubmitted?: () => void;
}) {
  const { address, connect } = useWallet();
  const [evidenceType, setEvidenceType] = useState<string>(EVIDENCE_TYPES[0]);
  const [sourceRef, setSourceRef] = useState("");
  const [claimSupported, setClaimSupported] = useState("");
  const [description, setDescription] = useState("");
  const [credibilityHint, setCredibilityHint] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validateEvidence({
      sourceRef,
      claimSupported,
      description,
      credibilityHint,
    });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    if (!address) {
      await connect();
      return;
    }

    try {
      setBusy(true);
      const result = await submitEvidence({
        vaultId,
        shardId: slugifyId(claimSupported, "shard"),
        evidenceType,
        sourceRef,
        claimSupported,
        description,
        credibilityHint,
      });
      setTxHash(result.txHash);
      setSourceRef("");
      setClaimSupported("");
      setDescription("");
      setCredibilityHint("");
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attest evidence.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Evidence Type</label>
        <select
          className="field-input"
          value={evidenceType}
          onChange={(e) => setEvidenceType(e.target.value)}
        >
          {EVIDENCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Claim Supported</label>
        <textarea
          className="field-input min-h-[80px]"
          value={claimSupported}
          onChange={(e) => setClaimSupported(e.target.value)}
          maxLength={700}
          placeholder="What does this shard support or contest?"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Source Reference</label>
        <input
          className="field-input"
          value={sourceRef}
          onChange={(e) => setSourceRef(e.target.value)}
          maxLength={500}
          placeholder="ipfs://… or https://…"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Description</label>
        <textarea
          className="field-input min-h-[90px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={900}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Credibility Hint (optional)</label>
        <input
          className="field-input"
          value={credibilityHint}
          onChange={(e) => setCredibilityHint(e.target.value)}
          maxLength={200}
          placeholder="e.g. primary source, eyewitness, secondhand"
        />
      </fieldset>

      {error && (
        <p className="font-mono text-xs text-rust-2 border border-rust-2/30 bg-rust-2/5 rounded-sm px-3 py-2">
          {error}
        </p>
      )}
      {txHash && <TxHashLink hash={txHash} label="Shard Attested ·" />}

      <button type="submit" disabled={busy} className="btn-archive self-start disabled:opacity-50">
        {address ? (busy ? "Sealing the shard…" : "Attest Evidence") : "Connect Wallet"}
      </button>
    </form>
  );
}

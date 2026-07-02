"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/useWallet";
import { openFracture } from "@/lib/contract";
import { validateFracture, slugifyId } from "@/lib/validation";
import { FRACTURE_TYPES, FRACTURE_TARGET_TYPES } from "@/lib/constants";
import { TxHashLink } from "@/components/chain/TxHashLink";

export function FractureForm({ vaultId }: { vaultId: string }) {
  const router = useRouter();
  const { address, connect } = useWallet();

  const [fractureType, setFractureType] = useState<string>(FRACTURE_TYPES[0]);
  const [targetType, setTargetType] = useState<string>(FRACTURE_TARGET_TYPES[0]);
  const [targetId, setTargetId] = useState("");
  const [claim, setClaim] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validateFracture({ targetId, claim, evidenceRef });
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
      const fractureId = slugifyId(claim, "fracture");
      const result = await openFracture({
        vaultId,
        fractureId,
        fractureType,
        targetType,
        targetId,
        claim,
        evidenceRef,
      });
      setTxHash(result.txHash);
      router.push(`/vaults/${vaultId}/fractures`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open the fracture.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Fracture Type</label>
        <select
          className="field-input"
          value={fractureType}
          onChange={(e) => setFractureType(e.target.value)}
        >
          {FRACTURE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Target Type</label>
        <select
          className="field-input"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
        >
          {FRACTURE_TARGET_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Target Id</label>
        <input
          className="field-input"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          maxLength={80}
          placeholder="shard id, memory id, vault id, or inscription id being disputed"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Claim</label>
        <textarea
          className="field-input min-h-[100px]"
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          maxLength={700}
          placeholder="What is wrong, missing, or imbalanced about the current record?"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Evidence Reference (optional)</label>
        <input
          className="field-input"
          value={evidenceRef}
          onChange={(e) => setEvidenceRef(e.target.value)}
          maxLength={500}
          placeholder="Reference supporting your dispute"
        />
      </fieldset>

      {error && (
        <p className="font-mono text-xs text-rust-2 border border-rust-2/30 bg-rust-2/5 rounded-sm px-3 py-2">
          {error}
        </p>
      )}
      {txHash && <TxHashLink hash={txHash} label="Fracture Opened ·" />}

      <button type="submit" disabled={busy} className="btn-archive self-start disabled:opacity-50">
        {address ? (busy ? "Fracturing the seal…" : "Open a Fracture") : "Connect Wallet"}
      </button>
    </form>
  );
}

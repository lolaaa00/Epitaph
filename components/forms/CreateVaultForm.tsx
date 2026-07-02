"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/useWallet";
import { createLegacyVault } from "@/lib/contract";
import { validateCreateVault, slugifyId } from "@/lib/validation";
import { EVIDENCE_TYPES } from "@/lib/constants";
import { TxHashLink } from "@/components/chain/TxHashLink";

type Phase = "idle" | "pending" | "confirming" | "done" | "error";

export function CreateVaultForm() {
  const router = useRouter();
  const { address, connect } = useWallet();

  const [personName, setPersonName] = useState("");
  const [lifePeriod, setLifePeriod] = useState("");
  const [identityLine, setIdentityLine] = useState("");
  const [initialClaim, setInitialClaim] = useState("");
  const [submitterRelation, setSubmitterRelation] = useState("");
  const [initialEvidenceType, setInitialEvidenceType] = useState<string>(EVIDENCE_TYPES[0]);
  const [initialSourceRef, setInitialSourceRef] = useState("");
  const [initialEvidenceDescription, setInitialEvidenceDescription] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [vaultId, setVaultId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validateCreateVault({
      personName,
      lifePeriod,
      identityLine,
      initialClaim,
      submitterRelation,
      initialSourceRef,
      initialEvidenceDescription,
    });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    if (!address) {
      await connect();
      return;
    }

    const newVaultId = slugifyId(personName, "vault");
    setVaultId(newVaultId);

    try {
      setPhase("pending");
      const result = await createLegacyVault({
        vaultId: newVaultId,
        personName,
        lifePeriod,
        identityLine,
        initialClaim,
        submitterRelation,
        initialEvidenceType,
        initialSourceRef,
        initialEvidenceDescription,
      });
      setTxHash(result.txHash);
      setPhase("done");
      router.push(`/vaults/${newVaultId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open the vault.");
      setPhase("error");
    }
  }

  const busy = phase === "pending" || phase === "confirming";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Person Name</label>
        <input
          className="field-input"
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          placeholder="Amara Okonkwo"
          maxLength={96}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Life Period</label>
        <input
          className="field-input"
          value={lifePeriod}
          onChange={(e) => setLifePeriod(e.target.value)}
          placeholder="1968 — 2024"
          maxLength={64}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Identity Line</label>
        <input
          className="field-input"
          value={identityLine}
          onChange={(e) => setIdentityLine(e.target.value)}
          placeholder="community engineer, teacher, and informal mentor to early solar technicians"
          maxLength={160}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Initial Legacy Claim</label>
        <textarea
          className="field-input min-h-[110px]"
          value={initialClaim}
          onChange={(e) => setInitialClaim(e.target.value)}
          placeholder="What is being claimed about this life, and why does it deserve preservation?"
          maxLength={700}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Your Relationship</label>
        <input
          className="field-input"
          value={submitterRelation}
          onChange={(e) => setSubmitterRelation(e.target.value)}
          placeholder="former apprentice"
          maxLength={120}
        />
      </fieldset>

      <div className="h-px bg-gold/10" />

      <p className="font-serif italic text-sm text-parchment">
        Every vault must be opened with one attested fragment of evidence.
      </p>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Initial Evidence Type</label>
        <select
          className="field-input"
          value={initialEvidenceType}
          onChange={(e) => setInitialEvidenceType(e.target.value)}
        >
          {EVIDENCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Initial Source Reference</label>
        <input
          className="field-input"
          value={initialSourceRef}
          onChange={(e) => setInitialSourceRef(e.target.value)}
          placeholder="ipfs://demo-amara-notebook or https://example.com/amara-notebook"
          maxLength={500}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Initial Evidence Description</label>
        <textarea
          className="field-input min-h-[110px]"
          value={initialEvidenceDescription}
          onChange={(e) => setInitialEvidenceDescription(e.target.value)}
          placeholder="Notebook archive describing field repairs for clinic solar inverters between 2012 and 2019."
          maxLength={900}
        />
      </fieldset>

      {error && (
        <p className="font-mono text-xs text-rust-2 border border-rust-2/30 bg-rust-2/5 rounded-sm px-3 py-2">
          {error}
        </p>
      )}

      {phase === "pending" && (
        <p className="font-mono text-xs text-blue-2">
          Awaiting wallet confirmation for vault {vaultId}…
        </p>
      )}

      {txHash && <TxHashLink hash={txHash} label="Vault Opened ·" />}

      <button
        type="submit"
        disabled={busy}
        className="btn-archive self-start disabled:opacity-50"
      >
        {address ? (busy ? "Sealing the intake…" : "Open a Legacy Vault") : "Connect Wallet to Continue"}
      </button>
    </form>
  );
}

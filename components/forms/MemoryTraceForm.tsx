"use client";

import { useState } from "react";
import { useWallet } from "@/lib/useWallet";
import { submitMemory } from "@/lib/contract";
import { validateMemory, slugifyId } from "@/lib/validation";
import { TxHashLink } from "@/components/chain/TxHashLink";

export function MemoryTraceForm({
  vaultId,
  onSubmitted,
}: {
  vaultId: string;
  onSubmitted?: () => void;
}) {
  const { address, connect } = useWallet();
  const [relationship, setRelationship] = useState("");
  const [memoryText, setMemoryText] = useState("");
  const [context, setContext] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = validateMemory({ relationship, memoryText, context });
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
      const result = await submitMemory({
        vaultId,
        memoryId: slugifyId(memoryText, "memory"),
        relationship,
        memoryText,
        context,
      });
      setTxHash(result.txHash);
      setRelationship("");
      setMemoryText("");
      setContext("");
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record this voice trace.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Relationship</label>
        <input
          className="field-input"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          maxLength={120}
          placeholder="neighbor, colleague, student…"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Memory</label>
        <textarea
          className="field-input min-h-[120px]"
          value={memoryText}
          onChange={(e) => setMemoryText(e.target.value)}
          maxLength={1200}
          placeholder="What do you remember, plainly and honestly?"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label className="field-label">Context (optional)</label>
        <textarea
          className="field-input min-h-[70px]"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          maxLength={500}
          placeholder="When and where this memory comes from"
        />
      </fieldset>

      {error && (
        <p className="font-mono text-xs text-rust-2 border border-rust-2/30 bg-rust-2/5 rounded-sm px-3 py-2">
          {error}
        </p>
      )}
      {txHash && <TxHashLink hash={txHash} label="Voice Traced ·" />}

      <button type="submit" disabled={busy} className="btn-archive self-start disabled:opacity-50">
        {address ? (busy ? "Recording the trace…" : "Submit Voice Trace") : "Connect Wallet"}
      </button>
    </form>
  );
}

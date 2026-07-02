"use client";

import { useParams } from "next/navigation";
import { useVaultData } from "@/lib/useVaultData";
import { VoiceTrace } from "@/components/reliquary/VoiceTrace";
import { MemoryTraceForm } from "@/components/forms/MemoryTraceForm";

export default function MemoriesPage() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const { vault, memories, loading, error, refetch } = useVaultData(vaultId);

  if (error) return <p className="font-mono text-sm text-rust-2">{error}</p>;

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12">
      <div>
        <h2 className="font-serif text-2xl text-bone mb-6">Voice Traces</h2>
        {loading && <p className="font-mono text-xs text-dust">Listening for traces…</p>}
        <div className="flex flex-col gap-3">
          {memories.map((memory) => (
            <VoiceTrace key={memory.memoryId} memory={memory} />
          ))}
          {!loading && memories.length === 0 && (
            <p className="font-serif italic text-sm text-dust">No voice traces yet.</p>
          )}
        </div>
      </div>
      <div>
        <h2 className="font-serif text-2xl text-bone mb-6">Add a Voice Trace</h2>
        {vault?.sealed ? (
          <p className="font-serif italic text-sm text-dust">
            This vault is sealed. No further memories may be recorded.
          </p>
        ) : (
          <MemoryTraceForm vaultId={vaultId} onSubmitted={refetch} />
        )}
      </div>
    </div>
  );
}

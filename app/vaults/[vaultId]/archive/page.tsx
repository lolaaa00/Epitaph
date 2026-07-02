"use client";

import { useParams } from "next/navigation";
import { useVaultData } from "@/lib/useVaultData";
import { EvidenceShard } from "@/components/reliquary/EvidenceShard";
import { EvidenceForm } from "@/components/forms/EvidenceForm";

export default function ArchivePage() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const { vault, evidence, loading, error, refetch } = useVaultData(vaultId);

  if (error) {
    return <p className="font-mono text-sm text-rust-2">{error}</p>;
  }

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12">
      <div>
        <h2 className="font-serif text-2xl text-bone mb-6">Evidence Archive</h2>
        {loading && <p className="font-mono text-xs text-dust">Reading shards…</p>}
        <div className="flex flex-col gap-3">
          {evidence.map((shard) => (
            <EvidenceShard key={shard.shardId} shard={shard} />
          ))}
          {!loading && evidence.length === 0 && (
            <p className="font-serif italic text-sm text-dust">No evidence shards yet.</p>
          )}
        </div>
      </div>
      <div>
        <h2 className="font-serif text-2xl text-bone mb-6">Attest New Evidence</h2>
        {vault?.sealed ? (
          <p className="font-serif italic text-sm text-dust">
            This vault is sealed. No further evidence may be attested.
          </p>
        ) : (
          <EvidenceForm vaultId={vaultId} onSubmitted={refetch} />
        )}
      </div>
    </div>
  );
}

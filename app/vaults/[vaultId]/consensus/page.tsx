"use client";

import { useParams } from "next/navigation";
import { useVaultData } from "@/lib/useVaultData";
import { ConsensusInscription } from "@/components/reliquary/ConsensusInscription";

export default function ConsensusPage() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const { vault, inscription, loading, error, refetch } = useVaultData(vaultId);

  if (error) return <p className="font-mono text-sm text-rust-2">{error}</p>;
  if (loading || !vault) return <p className="font-mono text-xs text-dust">Opening the observatory…</p>;

  return (
    <div className="max-w-3xl">
      <h2 className="font-serif text-2xl text-bone mb-2">Consensus Observatory</h2>
      <p className="font-serif italic text-sm text-parchment mb-10">
        Validators do not vote. They independently interpret the evidence
        packet and agree on the essential shape of the record — not on
        identical prose.
      </p>
      <ConsensusInscription vault={vault} inscription={inscription} onRequested={refetch} />
    </div>
  );
}

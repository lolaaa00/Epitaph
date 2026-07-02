"use client";

import { useParams } from "next/navigation";
import { useVaultData } from "@/lib/useVaultData";
import {
  TimelineStrata,
  type TimelineStrataItem,
} from "@/components/reliquary/TimelineStrata";

export default function TimelinePage() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const { vault, evidence, memories, fractures, loading, error } = useVaultData(vaultId);

  if (error) return <p className="font-mono text-sm text-rust-2">{error}</p>;
  if (loading || !vault) return <p className="font-mono text-xs text-dust">Excavating strata…</p>;

  const items: TimelineStrataItem[] = [
    {
      id: vault.vaultId,
      tick: vault.createdAt,
      label: `Legacy Vault opened for ${vault.personName}`,
      tone: "gold" as const,
    },
    ...evidence.map((e) => ({
      id: e.shardId,
      tick: e.createdAt,
      label: `[${e.evidenceType}] ${e.claimSupported}`,
      tone: "gold" as const,
    })),
    ...memories.map((m) => ({
      id: m.memoryId,
      tick: m.createdAt,
      label: `Voice trace from ${m.relationship || "a contributor"}: “${m.memoryText.slice(0, 90)}${m.memoryText.length > 90 ? "…" : ""}”`,
      tone: "blue" as const,
    })),
    ...fractures.map((f) => ({
      id: f.fractureId,
      tick: f.createdAt,
      label: `Fracture opened — ${f.fractureType.replace(/_/g, " ")}: ${f.claim.slice(0, 90)}`,
      tone: "rust" as const,
    })),
  ].sort((a, b) => a.tick - b.tick);

  return (
    <div>
      <h2 className="font-serif text-2xl text-bone mb-6">Timeline Strata</h2>
      <p className="font-serif italic text-sm text-parchment mb-10 max-w-lg">
        Excavation layers of {vault.personName}&rsquo;s legacy record, ordered by
        protocol tick — every attestation, trace, and fracture as it entered
        the chain.
      </p>
      <div className="max-w-2xl">
        <TimelineStrata items={items} />
      </div>
    </div>
  );
}

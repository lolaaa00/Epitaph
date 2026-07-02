"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useVaultData } from "@/lib/useVaultData";
import { ReliquaryShell, PanelLabel } from "@/components/reliquary/ReliquaryShell";
import { MemorySeal } from "@/components/reliquary/MemorySeal";
import { ImpactAura } from "@/components/reliquary/ImpactAura";
import { LegacyInscription } from "@/components/reliquary/LegacyInscription";
import { FractureGlass } from "@/components/reliquary/FractureGlass";
import { EvidenceShard } from "@/components/reliquary/EvidenceShard";
import { VoiceTrace } from "@/components/reliquary/VoiceTrace";
import {
  TimelineStrata,
  type TimelineStrataItem,
} from "@/components/reliquary/TimelineStrata";

export default function VaultDetailPage() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const { vault, evidence, memories, inscription, fractures, loading, error } =
    useVaultData(vaultId);

  if (error) {
    return (
      <p className="font-mono text-sm text-rust-2 border border-rust-2/30 bg-rust-2/5 rounded-sm px-4 py-3">
        {error}
      </p>
    );
  }

  if (loading || !vault) {
    return <p className="font-mono text-xs text-dust">Opening the reliquary…</p>;
  }

  const timelineItems: TimelineStrataItem[] = [
    ...evidence.map((e) => ({
      id: e.shardId,
      tick: e.createdAt,
      label: `Evidence attested: ${e.claimSupported}`,
      tone: "gold" as const,
    })),
    ...memories.map((m) => ({
      id: m.memoryId,
      tick: m.createdAt,
      label: `Voice traced by ${m.relationship || "a contributor"}`,
      tone: "blue" as const,
    })),
    ...fractures.map((f) => ({
      id: f.fractureId,
      tick: f.createdAt,
      label: `Fracture opened: ${f.fractureType.replace(/_/g, " ")}`,
      tone: "rust" as const,
    })),
  ].sort((a, b) => a.tick - b.tick);

  return (
    <ReliquaryShell
      header={
        <div className="flex items-start justify-between flex-wrap gap-8">
          <div>
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-dust mb-3">
              Legacy Vault · {vault.vaultId}
            </div>
            <h1 className="font-serif text-[clamp(2.25rem,5vw,3.5rem)] font-light text-bone mb-2.5">
              {vault.personName}
            </h1>
            <p className="font-serif italic text-[1.125rem] text-parchment max-w-lg leading-relaxed">
              {vault.identityLine} · {vault.lifePeriod}
            </p>
            <div className="mt-6">
              <MemorySeal state={vault.state} size={96} />
            </div>
          </div>
          <ImpactAura
            impactScore={vault.impactScore}
            memoryConfidence={vault.memoryConfidence}
            controversyLevel={vault.controversyLevel}
          />
        </div>
      }
      left={
        <>
          <PanelLabel>Timeline Strata</PanelLabel>
          <TimelineStrata items={timelineItems.slice(-6)} />
          <Link
            href={`/vaults/${vaultId}/timeline`}
            className="block mt-4 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-gold-2"
          >
            View full timeline →
          </Link>
        </>
      }
      center={
        <div className="relative">
          {vault.state === "DISPUTED" && <FractureGlass fractures={fractures} />}
          <PanelLabel>Consensus Inscription</PanelLabel>
          <LegacyInscription inscription={inscription} />
          <Link
            href={`/vaults/${vaultId}/consensus`}
            className="inline-block mt-6 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-gold-2"
          >
            Open Consensus Observatory →
          </Link>
        </div>
      }
      right={
        <>
          <PanelLabel>Evidence Shards</PanelLabel>
          <div className="flex flex-col gap-2.5 mb-8">
            {evidence.slice(0, 3).map((shard) => (
              <EvidenceShard key={shard.shardId} shard={shard} />
            ))}
            {evidence.length === 0 && (
              <p className="font-serif italic text-sm text-dust">No shards yet.</p>
            )}
          </div>
          <Link
            href={`/vaults/${vaultId}/archive`}
            className="block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-gold-2 mb-8"
          >
            View archive ({vault.evidenceCount}) →
          </Link>

          <PanelLabel>Voice Traces</PanelLabel>
          <div className="flex flex-col gap-2.5">
            {memories.slice(0, 2).map((memory) => (
              <VoiceTrace key={memory.memoryId} memory={memory} />
            ))}
            {memories.length === 0 && (
              <p className="font-serif italic text-sm text-dust">No traces yet.</p>
            )}
          </div>
          <Link
            href={`/vaults/${vaultId}/memories`}
            className="block mt-4 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-gold-2"
          >
            View memories ({vault.memoryCount}) →
          </Link>

          {vault.fractureCount > 0 && (
            <Link
              href={`/vaults/${vaultId}/fractures`}
              className="block mt-8 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-rust-2"
            >
              {vault.fractureCount} fracture{vault.fractureCount > 1 ? "s" : ""} →
            </Link>
          )}
        </>
      }
    />
  );
}

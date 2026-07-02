import Link from "next/link";
import type { LegacyVault } from "@/lib/formatters";
import { MemorySeal } from "@/components/reliquary/MemorySeal";

export function VaultCard({ vault }: { vault: LegacyVault }) {
  return (
    <Link
      href={`/vaults/${vault.vaultId}`}
      className="group relative block bg-obsidian border border-gold/10 rounded-sm px-8 py-9 overflow-hidden transition-all duration-500 hover:border-gold/30 hover:shadow-[0_0_48px_rgba(214,168,79,0.06)]"
    >
      <span className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="mb-6 scale-75 origin-left">
        <MemorySeal state={vault.state} size={64} />
      </div>
      <div className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-dust mb-1.5">
        {vault.lifePeriod || "Undated"}
      </div>
      <div className="font-serif text-2xl text-bone leading-tight mb-2">{vault.personName}</div>
      <div className="font-serif italic text-[0.9375rem] text-parchment leading-snug mb-6 line-clamp-3">
        {vault.identityLine}
      </div>
      <div className="flex flex-col gap-2 mb-6">
        <Row label="Impact Score" value={`${vault.impactScore} / 100`} tone="gold" />
        <Row label="Memory Confidence" value={`${vault.memoryConfidence}%`} tone="blue" />
        <Row label="Controversy" value={vault.controversyLevel} tone="verd" />
        <Row label="Evidence Shards" value={String(vault.evidenceCount)} />
        <Row label="Voice Traces" value={String(vault.memoryCount)} />
        {vault.fractureCount > 0 && (
          <Row label="Fractures" value={String(vault.fractureCount)} tone="rust" />
        )}
      </div>
      <StateBadge state={vault.state} fractureCount={vault.fractureCount} />
    </Link>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gold" | "blue" | "rust" | "verd";
}) {
  const toneClass =
    tone === "gold"
      ? "text-gold-2"
      : tone === "blue"
      ? "text-blue"
      : tone === "rust"
      ? "text-rust-2"
      : tone === "verd"
      ? "text-verdigris"
      : "text-bone";
  return (
    <div className="flex justify-between items-center">
      <span className="font-mono text-[0.575rem] uppercase tracking-[0.14em] text-dust">
        {label}
      </span>
      <span className={`font-mono text-[0.7rem] ${toneClass}`}>{value}</span>
    </div>
  );
}

function StateBadge({
  state,
  fractureCount,
}: {
  state: LegacyVault["state"];
  fractureCount: number;
}) {
  const tone =
    state === "DISPUTED"
      ? "text-rust-2 bg-rust-2/10 border-rust-2/20"
      : state === "AWAITING_CONSENSUS"
      ? "text-blue-2 bg-blue/10 border-blue/[0.22]"
      : "text-gold bg-gold/10 border-gold/20";

  return (
    <div
      className={`inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.16em] px-3 py-1.5 rounded-sm border ${tone}`}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-current" />
      {state.replace(/_/g, " ")}
      {state === "DISPUTED" && fractureCount > 0 ? ` · ${fractureCount} fractures` : ""}
    </div>
  );
}

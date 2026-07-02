import type { EvidenceShard as EvidenceShardT } from "@/lib/formatters";
import { truncateHash } from "@/lib/formatters";

const TYPE_LABEL: Record<string, string> = {
  WRITING: "Writing · Parchment Shard",
  ACHIEVEMENT: "Achievement · Gold-Etched Plaque",
  TESTIMONIAL_SUPPORT: "Testimonial · Voice Waveform",
  PUBLIC_RECORD: "Public Record · Stone Tablet",
  MEDIA_REFERENCE: "Media Reference",
  AWARD: "Award · Gold-Etched Plaque",
  CONTROVERSY: "Controversy · Rust Fracture",
  CORRECTION: "Correction · Restoration Thread",
  COUNTER_CONTEXT: "Counter-Context",
  OTHER: "Evidence Fragment",
};

const TYPE_BORDER: Record<string, string> = {
  CONTROVERSY: "border-rust-2/25",
  CORRECTION: "border-blue/25",
  COUNTER_CONTEXT: "border-violet/25",
  AWARD: "border-gold/30",
  ACHIEVEMENT: "border-gold/30",
};

export function EvidenceShard({ shard }: { shard: EvidenceShardT }) {
  const border = TYPE_BORDER[shard.evidenceType] ?? "border-gold/10";

  return (
    <div
      className={`group bg-abyss/60 border ${border} rounded-sm px-4 py-3.5 transition-all duration-300 hover:translate-x-1 hover:border-gold/30`}
    >
      <div className="font-mono text-[0.575rem] uppercase tracking-[0.16em] text-dust mb-1.5">
        {TYPE_LABEL[shard.evidenceType] ?? shard.evidenceType}
      </div>
      <div className="font-serif text-[0.9375rem] text-parchment leading-snug">
        {shard.claimSupported}
      </div>
      <p className="font-sans text-xs text-dust mt-1.5 leading-relaxed">{shard.description}</p>
      <div className="flex items-center justify-between mt-2.5">
        <span className="font-mono text-[0.575rem] text-dust opacity-60">
          {shard.shardId} · {truncateHash(shard.submitter)}
        </span>
        <span className="font-mono text-[0.575rem] uppercase tracking-[0.1em] text-gold-2">
          {shard.status}
        </span>
      </div>
      {shard.sourceRef && (
        <div className="font-mono text-[0.625rem] text-dust mt-1 truncate opacity-70">
          {shard.sourceRef}
        </div>
      )}
    </div>
  );
}

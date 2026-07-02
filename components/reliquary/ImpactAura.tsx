import type { ControversyLevel } from "@/lib/constants";

const CONTROVERSY_COLOR: Record<ControversyLevel, string> = {
  LOW: "var(--verdigris)",
  MEDIUM: "var(--gold)",
  HIGH: "var(--rust-2)",
  SEVERE: "var(--rust)",
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-[140px] h-[2px] bg-gold/10 rounded-full overflow-hidden mt-1.5">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

export function ImpactAura({
  impactScore,
  memoryConfidence,
  controversyLevel,
}: {
  impactScore: number;
  memoryConfidence: number;
  controversyLevel: ControversyLevel;
}) {
  const controversyColor = CONTROVERSY_COLOR[controversyLevel] ?? "var(--dust)";

  return (
    <div className="flex flex-col gap-5 text-right">
      <div>
        <div className="font-mono text-[0.575rem] uppercase tracking-[0.16em] text-dust">
          Impact Score
        </div>
        <div className="font-serif text-4xl font-light gold-shimmer">{impactScore}</div>
        <ScoreBar value={impactScore} color="var(--gold)" />
      </div>
      <div>
        <div className="font-mono text-[0.575rem] uppercase tracking-[0.16em] text-dust">
          Memory Confidence
        </div>
        <div className="font-serif text-3xl font-light text-blue-2">{memoryConfidence}%</div>
        <ScoreBar value={memoryConfidence} color="var(--blue)" />
      </div>
      <div>
        <div className="font-mono text-[0.575rem] uppercase tracking-[0.16em] text-dust">
          Controversy
        </div>
        <div
          className="font-mono text-sm tracking-[0.1em] uppercase"
          style={{ color: controversyColor }}
        >
          {controversyLevel}
        </div>
      </div>
    </div>
  );
}

import type { FractureRecord } from "@/lib/formatters";

export function FractureGlass({
  fractures,
}: {
  fractures: FractureRecord[];
}) {
  const open = fractures.filter((f) => f.status === "OPEN" || f.status === "UNDER_REVIEW");
  if (open.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-sm">
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 w-full h-full opacity-60"
        preserveAspectRatio="none"
      >
        <g stroke="var(--rust-2)" strokeWidth={0.8} opacity={0.55}>
          <line x1="20" y1="10" x2="160" y2="140" />
          <line x1="160" y1="140" x2="120" y2="260" />
          <line x1="160" y1="140" x2="280" y2="120" />
          <line x1="280" y1="120" x2="380" y2="40" />
          <line x1="280" y1="120" x2="340" y2="270" />
        </g>
      </svg>
      <div className="absolute top-3 right-3 rounded-sm border border-rust-2/30 bg-rust-2/10 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-rust-2">
        {open.length} active fracture{open.length > 1 ? "s" : ""}
      </div>
    </div>
  );
}

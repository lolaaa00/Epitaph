export interface TimelineStrataItem {
  id: string;
  tick: number;
  label: string;
  tone: "gold" | "blue" | "rust";
}

const DOT_CLASS: Record<TimelineStrataItem["tone"], string> = {
  gold: "bg-gold/20 border border-gold",
  blue: "bg-blue/15 border border-blue",
  rust: "bg-rust-2/20 border border-rust-2",
};

export function TimelineStrata({ items }: { items: TimelineStrataItem[] }) {
  if (items.length === 0) {
    return <p className="font-serif italic text-sm text-dust">No strata recorded yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {items.map((item, idx) => (
        <div key={item.id} className="relative flex gap-3.5 py-3">
          {idx > 0 && (
            <span
              className="absolute left-[6px] top-0 w-px h-full bg-gold/10"
              aria-hidden
            />
          )}
          <span
            className={`mt-0.5 h-[13px] w-[13px] rounded-full flex-shrink-0 ${DOT_CLASS[item.tone]}`}
          />
          <div>
            <div className="font-mono text-[0.65rem] text-dust mb-0.5">tick {item.tick}</div>
            <div className="font-serif text-[0.9375rem] text-parchment leading-snug">
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

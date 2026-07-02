import type { MemoryTrace } from "@/lib/formatters";
import { truncateHash } from "@/lib/formatters";

export function VoiceTrace({ memory }: { memory: MemoryTrace }) {
  return (
    <div className="bg-abyss/60 border border-blue/10 rounded-sm px-4 py-3.5 transition-colors hover:border-blue/25">
      <div className="font-mono text-[0.575rem] uppercase tracking-[0.16em] text-blue-2 mb-1.5">
        {memory.relationship || "Voice Trace"}
      </div>
      <div className="font-serif italic text-[0.9375rem] text-parchment leading-relaxed">
        “{memory.memoryText}”
      </div>
      {memory.context && (
        <p className="font-sans text-xs text-dust mt-1.5 leading-relaxed">{memory.context}</p>
      )}
      <div className="flex items-center justify-between mt-2.5">
        <span className="font-mono text-[0.575rem] text-dust opacity-60">
          {memory.memoryId} · {truncateHash(memory.submitter)}
        </span>
        <span className="font-mono text-[0.575rem] uppercase tracking-[0.1em] text-blue-2">
          {memory.status}
        </span>
      </div>
    </div>
  );
}

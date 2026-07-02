import { explorerTxUrl } from "@/lib/constants";
import { truncateHash } from "@/lib/formatters";

export function TxHashLink({ hash, label }: { hash: string; label?: string }) {
  if (!hash) return null;
  return (
    <a
      href={explorerTxUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] tracking-wide text-dust hover:text-gold-2 transition-colors"
      title={hash}
    >
      <span className="text-dust">{label ?? "TX"}</span>
      <span className="text-gold-2">{truncateHash(hash)}</span>
      <span aria-hidden className="opacity-60">
        ↗
      </span>
    </a>
  );
}

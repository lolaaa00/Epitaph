import { explorerAddressUrl } from "@/lib/constants";
import { truncateHash } from "@/lib/formatters";

export function ContractAddressLink({ address }: { address: string }) {
  if (!address) {
    return (
      <span className="font-mono text-[0.65rem] text-rust-2">
        contract not configured
      </span>
    );
  }
  return (
    <a
      href={explorerAddressUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] tracking-wide text-dust hover:text-gold-2 transition-colors"
      title={address}
    >
      <span className="text-dust">CONTRACT</span>
      <span className="text-gold-2">{truncateHash(address)}</span>
      <span aria-hidden className="opacity-60">
        ↗
      </span>
    </a>
  );
}

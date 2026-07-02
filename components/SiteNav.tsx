import Link from "next/link";
import { ConnectWallet } from "@/components/chain/ConnectWallet";
import { ChainStatus } from "@/components/chain/ChainStatus";

export function SiteNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between px-6 sm:px-12 py-5 bg-abyss/90 backdrop-blur-xl border-b border-gold/[0.08]">
      <Link
        href="/"
        className="font-serif text-[1.125rem] tracking-[0.3em] uppercase text-gold no-underline"
      >
        Epitaph
      </Link>
      <ul className="hidden sm:flex gap-10 list-none">
        <li>
          <Link
            href="/vaults"
            className="font-sans text-[0.8125rem] text-dust hover:text-parchment uppercase tracking-[0.08em] transition-colors"
          >
            Vaults
          </Link>
        </li>
        <li>
          <Link
            href="/vaults/new"
            className="font-sans text-[0.8125rem] text-dust hover:text-parchment uppercase tracking-[0.08em] transition-colors"
          >
            Open a Vault
          </Link>
        </li>
      </ul>
      <div className="flex items-center gap-5">
        <div className="hidden sm:block">
          <ChainStatus />
        </div>
        <ConnectWallet />
      </div>
    </nav>
  );
}

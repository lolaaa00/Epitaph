"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Reliquary" },
  { href: "/archive", label: "Archive" },
  { href: "/timeline", label: "Timeline" },
  { href: "/memories", label: "Memories" },
  { href: "/consensus", label: "Consensus" },
  { href: "/fractures", label: "Fractures" },
];

export function VaultTabs({ vaultId }: { vaultId: string }) {
  const pathname = usePathname();
  const base = `/vaults/${vaultId}`;

  return (
    <div className="flex gap-2 flex-wrap mb-10 border-b border-gold/[0.08] pb-px">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={`font-mono text-[0.6875rem] uppercase tracking-[0.12em] px-4 py-3 border-b-2 transition-colors ${
              active
                ? "text-gold border-gold"
                : "text-dust border-transparent hover:text-parchment"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

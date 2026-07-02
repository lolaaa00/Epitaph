"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readVaults } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import type { LegacyVault } from "@/lib/formatters";
import { VaultCard } from "@/components/VaultCard";

export default function VaultsPage() {
  const [vaults, setVaults] = useState<LegacyVault[] | null>(null);
  const [error, setError] = useState<string | null>(
    CONTRACT_ADDRESS ? null : "EPITAPH contract address is not configured."
  );

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    readVaults()
      .then(setVaults)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to read vaults."));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16">
      <div className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.28em] text-dust flex items-center gap-3">
        <span className="text-gold">·</span> Archive Index
      </div>
      <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-light text-bone mb-4">
        The <span className="gold-word">Reliquary</span> Chambers
      </h1>
      <p className="font-serif italic text-parchment max-w-lg mb-12">
        Each vault is a sealed memory record, read directly from the EPITAPH
        contract. Consensus does not erase disagreement — it classifies it.
      </p>

      {error && (
        <p className="font-mono text-sm text-rust-2 border border-rust-2/30 bg-rust-2/5 rounded-sm px-4 py-3 max-w-xl">
          {error}
        </p>
      )}

      {!error && vaults === null && (
        <p className="font-mono text-xs text-dust">Reading the archive from chain…</p>
      )}

      {vaults && vaults.length === 0 && (
        <div className="font-serif italic text-parchment">
          No vaults have been opened yet.{" "}
          <Link href="/vaults/new" className="text-gold border-b border-gold/30">
            Open the first Legacy Vault
          </Link>
          .
        </div>
      )}

      {vaults && vaults.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault) => (
            <VaultCard key={vault.vaultId} vault={vault} />
          ))}
        </div>
      )}
    </div>
  );
}

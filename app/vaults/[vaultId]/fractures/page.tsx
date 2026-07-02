"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useVaultData } from "@/lib/useVaultData";
import { useWallet } from "@/lib/useWallet";
import { sealVault } from "@/lib/contract";
import { FractureCard } from "@/components/FractureCard";
import { TxHashLink } from "@/components/chain/TxHashLink";

export default function FracturesPage() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const { vault, fractures, loading, error, refetch } = useVaultData(vaultId);
  const { address, connect } = useWallet();

  const [sealBusy, setSealBusy] = useState(false);
  const [sealError, setSealError] = useState<string | null>(null);
  const [sealTx, setSealTx] = useState<string | null>(null);

  const openFractures = fractures.filter(
    (f) => f.status === "OPEN" || f.status === "UNDER_REVIEW"
  );
  const canSeal =
    vault &&
    !vault.sealed &&
    (vault.state === "INSCRIBED" || vault.state === "RECONCILED") &&
    openFractures.length === 0;

  async function handleSeal() {
    if (!vault) return;
    setSealError(null);
    if (!address) {
      await connect();
      return;
    }
    try {
      setSealBusy(true);
      const result = await sealVault(vault.vaultId);
      setSealTx(result.txHash);
      refetch();
    } catch (err) {
      setSealError(err instanceof Error ? err.message : "Failed to seal vault.");
    } finally {
      setSealBusy(false);
    }
  }

  if (error) return <p className="font-mono text-sm text-rust-2">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="font-serif text-2xl text-bone">Fractures</h2>
        <Link href={`/vaults/${vaultId}/fractures/new`} className="btn-explore text-sm py-2 px-5">
          Open a Fracture
        </Link>
      </div>

      {loading && <p className="font-mono text-xs text-dust">Inspecting cracks…</p>}

      <div className="flex flex-col gap-4 mb-10">
        {fractures.map((fracture) => (
          <FractureCard key={fracture.fractureId} fracture={fracture} onResolved={refetch} />
        ))}
        {!loading && fractures.length === 0 && (
          <p className="font-serif italic text-sm text-dust">
            No fractures have been opened. This legacy stands unchallenged.
          </p>
        )}
      </div>

      {vault && !vault.sealed && (
        <div className="border-t border-gold/10 pt-8">
          <h3 className="font-serif text-lg text-bone mb-2">Seal the Vault</h3>
          <p className="font-serif italic text-sm text-parchment mb-4 max-w-lg">
            Sealing freezes the record. It is only possible once inscribed or
            reconciled, and only while no fracture remains open.
          </p>
          <button
            onClick={handleSeal}
            disabled={!canSeal || sealBusy}
            className="btn-archive disabled:opacity-40"
          >
            {sealBusy ? "Sealing…" : "Seal Vault"}
          </button>
          {!canSeal && (
            <p className="font-mono text-[0.65rem] text-dust mt-2">
              Requires state INSCRIBED or RECONCILED and zero open fractures.
            </p>
          )}
          {sealError && <p className="font-mono text-xs text-rust-2 mt-2">{sealError}</p>}
          {sealTx && (
            <div className="mt-2">
              <TxHashLink hash={sealTx} label="Sealed ·" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readVault,
  readEvidenceArchive,
  readMemoryTraces,
  readLatestInscription,
  readFractures,
} from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import type {
  LegacyVault,
  EvidenceShard,
  MemoryTrace,
  LegacyInscription,
  FractureRecord,
} from "@/lib/formatters";

export interface VaultData {
  vault: LegacyVault | null;
  evidence: EvidenceShard[];
  memories: MemoryTrace[];
  inscription: LegacyInscription | null;
  fractures: FractureRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVaultData(vaultId: string): VaultData {
  const [vault, setVault] = useState<LegacyVault | null>(null);
  const [evidence, setEvidence] = useState<EvidenceShard[]>([]);
  const [memories, setMemories] = useState<MemoryTrace[]>([]);
  const [inscription, setInscription] = useState<LegacyInscription | null>(null);
  const [fractures, setFractures] = useState<FractureRecord[]>([]);
  const [loading, setLoading] = useState(!!CONTRACT_ADDRESS);
  const [error, setError] = useState<string | null>(
    CONTRACT_ADDRESS ? null : "EPITAPH contract address is not configured."
  );
  const [generation, setGeneration] = useState(0);

  const refetch = useCallback(() => setGeneration((g) => g + 1), []);

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional refetch-on-dependency-change loading reset
    setLoading(true);
    setError(null);

    // Fetch the vault first so we know whether it has an inscription yet —
    // calling get_latest_inscription before one exists makes the contract
    // raise, which genlayer-js logs to console even though we catch it, so
    // skipping the call entirely avoids alarming (but harmless) console
    // noise on every freshly created vault.
    readVault(vaultId)
      .then((v) =>
        Promise.all([
          v,
          readEvidenceArchive(vaultId),
          readMemoryTraces(vaultId),
          v.latestInscriptionId ? readLatestInscription(vaultId) : Promise.resolve(null),
          readFractures(vaultId),
        ])
      )
      .then(([v, ev, mem, insc, frac]) => {
        if (cancelled) return;
        setVault(v);
        setEvidence(ev);
        setMemories(mem);
        setInscription(insc);
        setFractures(frac);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to read vault from chain.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vaultId, generation]);

  return { vault, evidence, memories, inscription, fractures, loading, error, refetch };
}

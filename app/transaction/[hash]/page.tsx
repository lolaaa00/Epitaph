"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getReadClient } from "@/lib/genlayerClient";
import { explorerTxUrl } from "@/lib/constants";
import { truncateHash } from "@/lib/formatters";

export default function TransactionPage() {
  const { hash } = useParams<{ hash: string }>();
  const [tx, setTx] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getReadClient();
    client
      .getTransaction({ hash: hash as unknown as Parameters<typeof client.getTransaction>[0]["hash"] })
      .then((result: unknown) => setTx(result as Record<string, unknown>))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Transaction not found.")
      );
  }, [hash]);

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-16">
      <div className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.28em] text-dust flex items-center gap-3">
        <span className="text-gold">·</span> Transaction Trail
      </div>
      <h1 className="font-serif text-3xl font-light text-bone mb-3">
        {truncateHash(hash, 10, 8)}
      </h1>
      <a
        href={explorerTxUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-gold-2 border-b border-gold-2/30 inline-block mb-10"
      >
        View on GenLayer Explorer Studio ↗
      </a>

      {error && (
        <p className="font-mono text-sm text-rust-2 border border-rust-2/30 bg-rust-2/5 rounded-sm px-4 py-3">
          {error}
        </p>
      )}

      {!error && !tx && <p className="font-mono text-xs text-dust">Reading transaction…</p>}

      {tx && (
        <pre className="font-mono text-xs text-parchment bg-obsidian border border-gold/10 rounded-sm p-6 overflow-x-auto whitespace-pre-wrap break-all">
          {JSON.stringify(
            tx,
            (_key, value) => (typeof value === "bigint" ? value.toString() : value),
            2
          )}
        </pre>
      )}
    </div>
  );
}

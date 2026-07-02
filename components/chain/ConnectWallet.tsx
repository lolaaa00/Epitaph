"use client";

import { useWallet } from "@/lib/useWallet";
import { truncateHash } from "@/lib/formatters";

export function ConnectWallet({ className = "" }: { className?: string }) {
  const {
    address,
    connecting,
    error,
    pendingSelection,
    connect,
    selectWallet,
    cancelSelection,
    disconnect,
  } = useWallet();

  if (address) {
    return (
      <button
        onClick={disconnect}
        className={`font-serif italic text-[0.9375rem] text-gold border-b border-gold/30 pb-px hover:text-gold-2 hover:border-gold-2/60 transition-colors ${className}`}
        title="Disconnect wallet"
      >
        {truncateHash(address)}
      </button>
    );
  }

  return (
    <div className={`relative flex flex-col items-end gap-1 ${className}`}>
      <button
        onClick={connect}
        disabled={connecting}
        className="font-serif italic text-[0.9375rem] text-gold border-b border-gold/30 pb-px hover:text-gold-2 hover:border-gold-2/60 transition-colors disabled:opacity-50"
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {error && (
        <span className="font-mono text-[0.6rem] text-rust-2 max-w-[220px] text-right">
          {error}
        </span>
      )}
      {pendingSelection && pendingSelection.length > 0 && (
        <div className="absolute top-full right-0 mt-2 z-50 w-56 bg-obsidian border border-gold/20 rounded-sm shadow-xl py-2">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-dust px-3 pb-2">
            Multiple wallets detected
          </p>
          {pendingSelection.map((wallet) => (
            <button
              key={wallet.uuid}
              onClick={() => selectWallet(wallet)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 font-sans text-sm text-parchment hover:bg-gold/10 transition-colors"
            >
              {wallet.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={wallet.icon} alt="" className="w-4 h-4" />
              )}
              {wallet.name}
            </button>
          ))}
          <button
            onClick={cancelSelection}
            className="w-full text-left px-3 py-2 font-mono text-[0.6875rem] text-dust hover:text-parchment transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectWallet,
  connectWalletWithProvider,
  disconnectWallet,
  type DiscoveredWallet,
} from "./genlayerClient";

interface WalletState {
  address: string | null;
  connecting: boolean;
  error: string | null;
  pendingSelection: DiscoveredWallet[] | null;
  connect: () => Promise<void>;
  selectWallet: (wallet: DiscoveredWallet) => Promise<void>;
  cancelSelection: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<DiscoveredWallet[] | null>(
    null
  );

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    setPendingSelection(null);
    try {
      const result = await connectWallet();
      if ("needsSelection" in result) {
        setPendingSelection(result.needsSelection);
      } else {
        setAddress(result.address);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const selectWallet = useCallback(async (wallet: DiscoveredWallet) => {
    setConnecting(true);
    setError(null);
    try {
      const account = await connectWalletWithProvider(wallet.provider);
      setAddress(account);
      setPendingSelection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const cancelSelection = useCallback(() => {
    setPendingSelection(null);
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setAddress(null);
  }, []);

  const value = useMemo(
    () => ({
      address,
      connecting,
      error,
      pendingSelection,
      connect,
      selectWallet,
      cancelSelection,
      disconnect,
    }),
    [address, connecting, error, pendingSelection, connect, selectWallet, cancelSelection, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return ctx;
}

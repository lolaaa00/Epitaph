"use client";

import { createClient, chains } from "genlayer-js";
import {
  GENLAYER_CHAIN_ID,
  GENLAYER_EXPLORER_BASE,
  GENLAYER_RPC_URL,
} from "./constants";

type EpitaphClient = ReturnType<typeof createClient>;

export interface InjectedEthereumProvider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: InjectedEthereumProvider;
  }
}

// EIP-6963: every installed wallet extension announces itself independently,
// instead of all of them racing to clobber the single `window.ethereum`
// global. With more than one wallet extension installed, relying on
// `window.ethereum` alone means whichever wallet wins that race silently
// handles the connect request — sometimes auto-approving without ever
// showing a popup. Discovering providers this way lets the user pick the
// wallet that should actually receive the request.
export interface DiscoveredWallet {
  uuid: string;
  name: string;
  rdns: string;
  icon: string;
  provider: InjectedEthereumProvider;
}

interface EIP6963ProviderDetail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: InjectedEthereumProvider;
}

const GENLAYER_CHAIN_ID_HEX = `0x${GENLAYER_CHAIN_ID.toString(16)}`; // 61999 -> 0xf22f

const epitaphStudioChain = {
  ...chains.studionet,
  rpcUrls: { default: { http: [GENLAYER_RPC_URL] } },
  blockExplorers: {
    default: { name: "GenLayer Explorer Studio", url: GENLAYER_EXPLORER_BASE },
  },
};

let cachedClient: EpitaphClient | null = null;
let cachedAccount: string | null = null;
let cachedProvider: InjectedEthereumProvider | null = null;

/** Discovers every EIP-6963-compliant wallet extension currently installed. */
export function discoverWallets(timeoutMs = 350): Promise<DiscoveredWallet[]> {
  if (typeof window === "undefined") return Promise.resolve([]);

  return new Promise((resolve) => {
    const found = new Map<string, DiscoveredWallet>();

    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (!detail?.provider || !detail?.info) return;
      found.set(detail.info.uuid, {
        uuid: detail.info.uuid,
        name: detail.info.name,
        rdns: detail.info.rdns,
        icon: detail.info.icon,
        provider: detail.provider,
      });
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      resolve(Array.from(found.values()));
    }, timeoutMs);
  });
}

/** Fallback for wallets that only set `window.ethereum` (no EIP-6963 support). */
export function getLegacyInjectedProvider(): InjectedEthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return window.ethereum;
}

/**
 * Ensures the wallet has GenLayer Studio (chain 61999) added and selected.
 * This is the step that was missing: genlayer-js routes `eth_sendTransaction`
 * to the wallet but skips the chain check for studio networks, so the wallet
 * must already be on 61999 or every write silently targets the wrong chain.
 * Triggers the wallet's "add network" / "switch network" prompts.
 */
async function ensureGenLayerChain(provider: InjectedEthereumProvider): Promise<void> {
  let currentChainId: string | undefined;
  try {
    currentChainId = (await provider.request({ method: "eth_chainId" })) as string;
  } catch {
    currentChainId = undefined;
  }
  if (currentChainId === GENLAYER_CHAIN_ID_HEX) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GENLAYER_CHAIN_ID_HEX }],
    });
  } catch (switchErr) {
    // 4902 = chain not added yet. Add it, then it is selected automatically.
    const code = (switchErr as { code?: number })?.code;
    if (code === 4902 || code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: GENLAYER_CHAIN_ID_HEX,
            chainName: "GenLayer Studio Network",
            rpcUrls: [GENLAYER_RPC_URL],
            nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
            blockExplorerUrls: [GENLAYER_EXPLORER_BASE],
          },
        ],
      });
    } else {
      throw switchErr;
    }
  }
}

export async function connectWalletWithProvider(
  provider: InjectedEthereumProvider
): Promise<string> {
  // 1. Request accounts — first popup.
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error("Wallet connection was rejected.");
  }

  // 2. Make sure the wallet is on GenLayer Studio (61999) — second popup if
  //    the network is not yet added/selected. Required for writes to sign.
  await ensureGenLayerChain(provider);

  cachedAccount = accounts[0];
  cachedProvider = provider;
  cachedClient = createClient({
    chain: epitaphStudioChain,
    provider,
    account: accounts[0] as `0x${string}`,
  });
  return accounts[0];
}

/**
 * Connects a wallet. If exactly one EIP-6963 wallet is found, connects to it
 * directly. If multiple are found, returns them so the caller can prompt the
 * user to choose (avoids silently picking the wrong wallet when several are
 * installed). Falls back to the legacy `window.ethereum` singleton only when
 * no EIP-6963 wallets announce themselves at all.
 */
export async function connectWallet(): Promise<
  { address: string } | { needsSelection: DiscoveredWallet[] }
> {
  const wallets = await discoverWallets();

  if (wallets.length === 1) {
    const address = await connectWalletWithProvider(wallets[0].provider);
    return { address };
  }

  if (wallets.length > 1) {
    return { needsSelection: wallets };
  }

  const legacy = getLegacyInjectedProvider();
  if (!legacy) {
    throw new Error(
      "No external wallet detected. Install MetaMask or another GenLayer-compatible injected wallet extension to enter the Reliquary."
    );
  }
  const address = await connectWalletWithProvider(legacy);
  return { address };
}

export function getConnectedAccount(): string | null {
  return cachedAccount;
}

/** Read-only client; works without a connected wallet. */
export function getReadClient(): EpitaphClient {
  if (cachedClient) return cachedClient;
  return createClient({
    chain: epitaphStudioChain,
    provider: cachedProvider ?? getLegacyInjectedProvider(),
  });
}

/** Write client; throws if the wallet has not been connected yet. */
export function getWriteClient(): EpitaphClient {
  if (!cachedClient || !cachedAccount) {
    throw new Error("Connect a wallet before submitting a transaction.");
  }
  return cachedClient;
}

export function disconnectWallet(): void {
  cachedClient = null;
  cachedAccount = null;
  cachedProvider = null;
}

import { BrowserProvider, JsonRpcProvider } from "ethers";
import type { Eip1193Provider } from "ethers";

const resolveEnv = (name: string): string | undefined => process.env?.[name];

export const CHAIN_CONFIG = {
  name: resolveEnv("ZEROCLAW_0G_NETWORK_NAME") || "0G Galileo Testnet",
  rpcUrl: resolveEnv("ZEROCLAW_0G_RPC_URL") || "https://evmrpc-testnet.0g.ai",
  chainId: Number.parseInt(resolveEnv("ZEROCLAW_0G_CHAIN_ID") || "16602", 10),
  currency: "0G",
  explorerUrl: resolveEnv("ZEROCLAW_0G_EXPLORER_URL") || "https://chainscan-galileo.0g.ai",
};

/**
 * Returns a JsonRpcProvider for server-side / Node.js usage (Discord bot).
 * Connects directly to the 0G RPC without needing a browser wallet.
 */
export const getJsonRpcProvider = (): JsonRpcProvider => {
  return new JsonRpcProvider(CHAIN_CONFIG.rpcUrl, {
    name: CHAIN_CONFIG.name,
    chainId: CHAIN_CONFIG.chainId,
  });
};

/**
 * Initializes a connection to the 0G network using ethers.
 * For browser/dashboard usage — requires window.ethereum (MetaMask etc).
 */
export const getProvider = (): BrowserProvider | null => {
  const browserWindow = globalThis as typeof globalThis & {
    ethereum?: Eip1193Provider;
  };

  if (browserWindow.ethereum) {
    return new BrowserProvider(browserWindow.ethereum);
  }
  console.warn("No Web3 provider found. Please install a wallet.");
  return null;
};

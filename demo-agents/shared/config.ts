import { createWalletClient, createPublicClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import * as dotenv from "dotenv"

dotenv.config()

// ─── Flare Coston2 Testnet ────────────────────────────────────────────────────

export const coston2 = {
  id: 114,
  name: "Coston2",
  network: "coston2",
  nativeCurrency: { name: "Coston2 FLR", symbol: "C2FLR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://coston2-api.flare.network/ext/C/rpc"] },
    public:  { http: ["https://coston2-api.flare.network/ext/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Coston2 Explorer", url: "https://coston2-explorer.flare.network" },
  },
} as const

// ─── Env validation ───────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

// Agent A uses AGENT_A_PRIVATE_KEY, Agent B uses AGENT_B_PRIVATE_KEY
export function getAccount(role: "A" | "B") {
  const key = requireEnv(`AGENT_${role}_PRIVATE_KEY`) as `0x${string}`
  return privateKeyToAccount(key)
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export const publicClient = createPublicClient({
  chain: coston2,
  transport: http(process.env.FLARE_RPC_URL ?? coston2.rpcUrls.default.http[0]),
})

export function getWalletClient(role: "A" | "B") {
  return createWalletClient({
    account: getAccount(role),
    chain: coston2,
    transport: http(process.env.FLARE_RPC_URL ?? coston2.rpcUrls.default.http[0]),
  })
}

// ─── Agent B server ───────────────────────────────────────────────────────────

export const AGENT_B_PORT = Number(process.env.AGENT_B_PORT ?? 3001)
export const AGENT_B_URL  = process.env.AGENT_B_URL ?? `http://localhost:${AGENT_B_PORT}`

// ─── Storage (IPFS via Pinata) ────────────────────────────────────────────────

// Used by Agent B to store results, Agent A to read schemas
// Leave blank to use local mock storage during development
export const PINATA_JWT = process.env.PINATA_JWT ?? ""

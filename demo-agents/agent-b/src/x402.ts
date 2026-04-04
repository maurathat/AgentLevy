// x402 middleware for Flare Coston2 — spec-compliant HTTP 402 payment gate.
//
// Flow:
//   1. Request arrives with no X-Payment header → return 402 + PaymentRequired descriptor
//   2. Agent A pays on-chain (USDC transfer to payTo) and retries with X-Payment header
//   3. Middleware verifies the Transfer event on Coston2 → calls next() on success

import { Request, Response, NextFunction } from "express"
import { parseUnits, getAddress }          from "viem"
import { publicClient }                    from "../../shared/config"
import { CONTRACT_ADDRESSES }              from "../../shared/contracts"

// ─── Protocol Types ───────────────────────────────────────────────────────────

export interface X402Accept {
  scheme:            "exact"
  network:           string
  maxAmountRequired: string          // token base units (e.g. "10000" = 0.01 USDC)
  resource:          string          // full URL of the gated endpoint
  description:       string
  mimeType:          string
  payTo:             `0x${string}`   // Agent B receiving address
  maxTimeoutSeconds: number
  asset:             `0x${string}`   // ERC20 token address
}

export interface X402PaymentRequired {
  x402Version: 1
  accepts: X402Accept[]
  error: "Payment Required"
}

// Receipt is base64-encoded JSON sent in the X-Payment header
export interface X402Receipt {
  x402Version: 1
  scheme:      "exact"
  network:     string
  payload: {
    from:    `0x${string}`
    txHash:  `0x${string}`
    amount:  string          // token base units
  }
}

// ─── Middleware Config ─────────────────────────────────────────────────────────

export interface X402Config {
  amount:       string           // human-readable USDC, e.g. "0.01"
  payTo:        `0x${string}`    // Agent B wallet address (receives the fee)
  description?: string
}

// ─── Replay protection ────────────────────────────────────────────────────────
// In-memory for Phase 2. Replace with Redis in Phase 3.

const seenTxHashes = new Set<string>()

// ─── ERC20 Transfer topic ─────────────────────────────────────────────────────
// keccak256("Transfer(address,address,uint256)")

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

// ─── On-chain verification ────────────────────────────────────────────────────

async function verifyOnChain(
  receipt: X402Receipt,
  config:  X402Config
): Promise<{ ok: boolean; reason?: string }> {
  const { txHash } = receipt.payload

  // 1. Replay check
  if (seenTxHashes.has(txHash)) {
    return { ok: false, reason: "tx already used" }
  }

  // 2. Fetch tx receipt from Coston2
  let txReceipt
  try {
    txReceipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
  } catch {
    return { ok: false, reason: "tx not found on chain" }
  }

  if (!txReceipt || txReceipt.status !== "success") {
    return { ok: false, reason: "tx reverted or not yet mined" }
  }

  // 3. Scan logs for Transfer(from → payTo, value >= required)
  const requiredAmount = parseUnits(config.amount, 6) // USDC has 6 decimals
  const usdcAddress    = getAddress(CONTRACT_ADDRESSES.usdc)
  const payTo          = getAddress(config.payTo)

  const transferFound = txReceipt.logs.some(log => {
    if (getAddress(log.address) !== usdcAddress) return false
    if (log.topics[0] !== TRANSFER_TOPIC)        return false
    if (!log.topics[2])                          return false

    const logTo = getAddress(`0x${log.topics[2].slice(26)}`)
    if (logTo !== payTo) return false

    const value = BigInt(log.data)
    return value >= requiredAmount
  })

  if (!transferFound) {
    return {
      ok:     false,
      reason: `no USDC Transfer(→${payTo}, ≥${requiredAmount}) in tx ${txHash}`,
    }
  }

  // 4. Mark tx as used
  seenTxHashes.add(txHash)
  return { ok: true }
}

// ─── Middleware factory ───────────────────────────────────────────────────────

export function x402Middleware(config: X402Config) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawHeader = req.headers["x-payment"] as string | undefined

    // No header → issue 402 challenge
    if (!rawHeader) {
      const resource = `${req.protocol}://${req.get("host")}${req.originalUrl}`
      const descriptor: X402PaymentRequired = {
        x402Version: 1,
        accepts: [{
          scheme:            "exact",
          network:           "coston2",
          maxAmountRequired: String(parseUnits(config.amount, 6)),
          resource,
          description:       config.description ?? "Agent B task execution fee",
          mimeType:          "application/json",
          payTo:             config.payTo,
          maxTimeoutSeconds: 300,
          asset:             CONTRACT_ADDRESSES.usdc,
        }],
        error: "Payment Required",
      }
      res.status(402).json(descriptor)
      return
    }

    // Parse receipt from base64 header
    let receipt: X402Receipt
    try {
      receipt = JSON.parse(Buffer.from(rawHeader, "base64").toString("utf8"))
    } catch {
      res.status(400).json({ error: "malformed X-Payment header: expected base64 JSON" })
      return
    }

    // Verify on Coston2
    const { ok, reason } = await verifyOnChain(receipt, config)
    if (!ok) {
      res.status(402).json({ error: `payment verification failed: ${reason}` })
      return
    }

    next()
  }
}

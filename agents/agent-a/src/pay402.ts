// x402 client helper for Agent A.
//
// Usage:
//   const result = await payAndExecute("weather", { taskId: "abc" })
//
// Internally:
//   1. POST /tasks/:name/execute → 402 with payment descriptor
//   2. Send USDC transfer to payTo on Coston2
//   3. Build X402Receipt, base64-encode → X-Payment header
//   4. Retry POST → 200 with result

import axios                              from "axios"
import { parseUnits, getAddress }         from "viem"
import { publicClient, getWalletClient, AGENT_B_URL } from "../../shared/config"
import { CONTRACT_ADDRESSES, ERC20_ABI }  from "../../shared/contracts"
import type { X402PaymentRequired, X402Receipt } from "../agent-b/src/x402"

// ─── Send USDC on Coston2 ─────────────────────────────────────────────────────

async function sendUsdc(to: `0x${string}`, amountUnits: bigint): Promise<`0x${string}`> {
  const walletClient = getWalletClient("A")

  const txHash = await walletClient.writeContract({
    address:      CONTRACT_ADDRESSES.usdc,
    abi:          ERC20_ABI,
    functionName: "transfer",
    args:         [to, amountUnits],
  })

  await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log(`[Agent A] x402 payment sent — tx: ${txHash}`)
  return txHash
}

// ─── Build X-Payment header ───────────────────────────────────────────────────

function buildPaymentHeader(
  txHash:      `0x${string}`,
  amount:      string,
  fromAddress: `0x${string}`
): string {
  const receipt: X402Receipt = {
    x402Version: 1,
    scheme:      "exact",
    network:     "coston2",
    payload: {
      from:   fromAddress,
      txHash,
      amount,
    },
  }
  return Buffer.from(JSON.stringify(receipt)).toString("base64")
}

// ─── Pay and execute ──────────────────────────────────────────────────────────

export async function payAndExecute(
  taskName: string,
  body:     Record<string, unknown> = {}
): Promise<unknown> {
  const url = `${AGENT_B_URL}/tasks/${taskName}/execute`

  // 1. First call — expect 402
  let descriptor: X402PaymentRequired
  try {
    await axios.post(url, body)
    throw new Error("[Agent A] Expected 402 but got 200 — endpoint may not be x402 gated")
  } catch (err: any) {
    if (err.response?.status !== 402) throw err
    descriptor = err.response.data as X402PaymentRequired
  }

  const accept = descriptor.accepts[0]
  if (!accept) throw new Error("[Agent A] No payment option in 402 descriptor")

  console.log(`[Agent A] 402 received — paying ${accept.maxAmountRequired} units to ${accept.payTo}`)

  // 2. Pay on-chain
  const walletClient = getWalletClient("A")
  const fromAddress  = walletClient.account.address
  const amountUnits  = BigInt(accept.maxAmountRequired)

  const txHash = await sendUsdc(getAddress(accept.payTo) as `0x${string}`, amountUnits)

  // 3. Build payment header and retry
  const paymentHeader = buildPaymentHeader(txHash, accept.maxAmountRequired, fromAddress)

  const response = await axios.post(url, body, {
    headers: { "X-Payment": paymentHeader },
  })

  console.log(`[Agent A] x402 execution successful`)
  return response.data
}

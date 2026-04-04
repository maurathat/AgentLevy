// Step 5 — Agent A polls the Verifier contract until it sees a result,
// then confirms the treasury has released payment to the correct recipient.

import { publicClient } from "../../shared/config"
import { CONTRACT_ADDRESSES, VERIFIER_ABI, TASK_REGISTRY_ABI } from "../../shared/contracts"
import { TaskSettledEvent } from "../../shared/types"

const POLL_INTERVAL_MS = 4_000   // check every 4 seconds
const MAX_WAIT_MS      = 180_000  // give up after 3 minutes

// ─── Wait for verification result ─────────────────────────────────────────────

export async function waitForVerification(
  taskId: `0x${string}`
): Promise<{ passed: boolean }> {
  console.log(`[Agent A] Waiting for verification of task ${taskId}...`)

  const startedAt = Date.now()

  while (Date.now() - startedAt < MAX_WAIT_MS) {
    const result = await checkVerificationResult(taskId)

    if (result.verified) {
      const status = result.passed ? "PASSED ✓" : "FAILED ✗"
      console.log(`[Agent A] Verification complete: ${status}`)
      return { passed: result.passed }
    }

    console.log(`[Agent A] Not verified yet, polling again in ${POLL_INTERVAL_MS / 1000}s...`)
    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error(`[Agent A] Timeout — verification not received for task ${taskId}`)
}

// ─── Read verification result from contract ───────────────────────────────────

async function checkVerificationResult(
  taskId: `0x${string}`
): Promise<{ verified: boolean; passed: boolean }> {
  const [verified, passed] = await publicClient.readContract({
    address:      CONTRACT_ADDRESSES.verifier,
    abi:          VERIFIER_ABI,
    functionName: "getVerificationResult",
    args:         [taskId],
  }) as [boolean, boolean]
  return { verified, passed }
}

// ─── Confirm payment settled ──────────────────────────────────────────────────
// After verification, Agent A reads the TaskSettled event to confirm
// which address received the funds (seller on pass, buyer on fail).

export async function confirmSettlement(taskId: `0x${string}`): Promise<TaskSettledEvent | null> {
  const event     = TASK_REGISTRY_ABI.find(e => e.name === "TaskSettled")
  const latest    = await publicClient.getBlockNumber()
  const fromBlock = latest > 25n ? latest - 25n : 0n
  const logs = await publicClient.getLogs({
    address:   CONTRACT_ADDRESSES.taskRegistry,
    event:     event as any,
    args:      { taskId },
    fromBlock,
    toBlock:   latest,
  })
  if (logs.length > 0) {
    const settled = (logs[0] as any).args as TaskSettledEvent
    console.log(`[Agent A] Settlement confirmed — recipient: ${settled.recipient}, passed: ${settled.passed}`)
    return settled
  }
  return null
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

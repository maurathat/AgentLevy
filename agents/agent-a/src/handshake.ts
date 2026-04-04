// Step 2 (Agent A side) — Wait for Agent B to claim the task on-chain.
// Agent A polls the TaskRegistry until it sees a TaskClaimed event
// with the matching taskId, confirming the agreement is locked.

import { publicClient } from "../../shared/config"
import { CONTRACT_ADDRESSES, TASK_REGISTRY_ABI } from "../../shared/contracts"
import { TaskClaimedEvent } from "../../shared/types"

const POLL_INTERVAL_MS = 3_000  // check every 3 seconds
const MAX_WAIT_MS      = 120_000 // give up after 2 minutes

// ─── Wait for Agent B to claim ────────────────────────────────────────────────

export async function waitForClaim(taskId: `0x${string}`): Promise<TaskClaimedEvent> {
  console.log(`[Agent A] Waiting for Agent B to claim task ${taskId}...`)

  const startedAt = Date.now()

  while (Date.now() - startedAt < MAX_WAIT_MS) {
    const claimed = await checkClaimed(taskId)
    if (claimed) {
      console.log(`[Agent A] Agreement locked — Agent B: ${claimed.executor}`)
      console.log(`[Agent A] Deadline: ${new Date(Number(claimed.deadline) * 1000).toISOString()}`)
      return claimed
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error(`[Agent A] Timeout — no claim received for task ${taskId}`)
}

// ─── Check on-chain for TaskClaimed event ─────────────────────────────────────

async function checkClaimed(taskId: `0x${string}`): Promise<TaskClaimedEvent | null> {
  // TODO: once contracts are deployed, replace with actual event log query
  // Example using viem getLogs:
  //
  // const logs = await publicClient.getLogs({
  //   address: CONTRACT_ADDRESSES.taskRegistry,
  //   event: TASK_REGISTRY_ABI.find(e => e.name === "TaskClaimed"),
  //   args: { taskId },
  //   fromBlock: "earliest",
  // })
  // if (logs.length > 0) return logs[0].args as TaskClaimedEvent

  // Phase 1 stub — simulate claim after 2 polls
  // Remove this block once contracts are live
  console.log(`[Agent A] Polling for claim... (stub)`)
  return null
}

// ─── Also expose a one-shot check (for client.ts to poll manually) ────────────

export async function isTaskClaimed(taskId: `0x${string}`): Promise<boolean> {
  const state = await publicClient.readContract({
    address: CONTRACT_ADDRESSES.taskRegistry,
    abi: TASK_REGISTRY_ABI,
    functionName: "getTaskState",
    args: [taskId],
  })
  // State 1 = CLAIMED (matches TaskState enum order)
  return Number(state) >= 1
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

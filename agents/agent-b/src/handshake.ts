// Step 2 (Agent B side) — Agent B sees a posted task and claims it on-chain.
// Calling claimTask() locks the agreement: A + B + deadline are recorded.
// After this, Agent B is committed to deliver or forfeit (no payment).

import { publicClient, getWalletClient } from "../../shared/config"
import { CONTRACT_ADDRESSES, TASK_REGISTRY_ABI } from "../../shared/contracts"
import { TaskSpec } from "../../shared/types"
import { TASKS } from "./tasks"

// ─── Check if Agent B can handle this task ────────────────────────────────────

export function canExecute(spec: TaskSpec): boolean {
  // Agent B checks if it has a matching task definition
  return Object.values(TASKS).some(
    def => def.description === spec.description || def.verificationType === spec.verification.type
  )
}

// ─── Claim task on-chain ──────────────────────────────────────────────────────

export async function claimTask(taskId: `0x${string}`): Promise<void> {
  console.log(`[Agent B] Claiming task: ${taskId}`)

  const walletClient = getWalletClient("B")

  const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.taskRegistry,
    abi: TASK_REGISTRY_ABI,
    functionName: "claimTask",
    args: [taskId],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log(`[Agent B] Task claimed — tx: ${txHash}`)
  console.log(`[Agent B] Block:          ${receipt.blockNumber}`)
}

// ─── Listen for new posted tasks ──────────────────────────────────────────────
// Agent B watches the TaskRegistry for TaskPosted events and auto-claims
// tasks it can handle.

export async function watchAndClaim(
  onClaimed: (taskId: `0x${string}`, spec: TaskSpec) => void
): Promise<void> {
  console.log("[Agent B] Watching for new tasks...")

  // TODO: once contracts are deployed, replace with actual event watcher
  // Example using viem watchEvent:
  //
  // publicClient.watchEvent({
  //   address: CONTRACT_ADDRESSES.taskRegistry,
  //   event: TASK_REGISTRY_ABI.find(e => e.name === "TaskPosted"),
  //   onLogs: async (logs) => {
  //     for (const log of logs) {
  //       const { taskId, specHash } = log.args
  //       // fetch spec off-chain (IPFS or Agent A endpoint), verify can handle it
  //       // then claim
  //       await claimTask(taskId)
  //       onClaimed(taskId, spec)
  //     }
  //   }
  // })

  // Phase 1 stub — nothing to watch yet
  console.log("[Agent B] (stub) No live contract to watch yet")
}

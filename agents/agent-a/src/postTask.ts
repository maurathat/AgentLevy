// Step 1 — Agent A describes the task, hashes the spec, and posts it on-chain
// with funds locked in the TaskRegistry contract.

import { keccak256, toBytes, parseUnits } from "viem"
import { publicClient, getWalletClient } from "../../shared/config"
import { CONTRACT_ADDRESSES, TASK_REGISTRY_ABI, ERC20_ABI } from "../../shared/contracts"
import { TaskSpec } from "../../shared/types"
import axios from "axios"
import { AGENT_B_URL } from "../../shared/config"

// ─── Fetch task spec from Agent B ─────────────────────────────────────────────
// Agent A asks Agent B what it can do, and gets back a ready-made TaskSpec.

export async function fetchTaskSpec(taskName: string): Promise<TaskSpec> {
  const res = await axios.get(`${AGENT_B_URL}/tasks/${taskName}/spec`)
  const spec: TaskSpec = res.data.spec

  // Stamp Agent A's address as the poster
  const walletClient = getWalletClient("A")
  spec.posterAddress = walletClient.account.address
  spec.postedAt = Date.now()

  return spec
}

// ─── Hash the spec ────────────────────────────────────────────────────────────
// The hash is the on-chain commitment. Agent B must deliver something that
// satisfies exactly this spec or the verifier will reject the proof.

export function hashSpec(spec: TaskSpec): `0x${string}` {
  const serialised = JSON.stringify(spec)
  return keccak256(toBytes(serialised))
}

// ─── Approve USDC spend ───────────────────────────────────────────────────────

async function approveUsdc(amount: bigint) {
  const walletClient = getWalletClient("A")
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [CONTRACT_ADDRESSES.taskRegistry, amount],
  })
  await publicClient.waitForTransactionReceipt({ hash })
  console.log(`[Agent A] USDC approved: ${hash}`)
}

// ─── Post task on-chain ───────────────────────────────────────────────────────

export async function postTask(spec: TaskSpec): Promise<`0x${string}`> {
  const specHash = hashSpec(spec)
  const amount   = parseUnits(spec.payment.amount, 6) // USDC has 6 decimals

  console.log(`[Agent A] Posting task: ${spec.id}`)
  console.log(`[Agent A] Spec hash:    ${specHash}`)
  console.log(`[Agent A] Amount:       ${spec.payment.amount} USDC`)

  // 1. Approve the registry to pull funds
  await approveUsdc(amount)

  // 2. Post task → emits TaskPosted event with taskId
  const walletClient = getWalletClient("A")
  const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.taskRegistry,
    abi: TASK_REGISTRY_ABI,
    functionName: "postTask",
    args: [
      specHash,
      amount,
      CONTRACT_ADDRESSES.usdc,
      BigInt(spec.payment.timeoutSeconds),
    ],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log(`[Agent A] Task posted — tx: ${txHash}`)
  console.log(`[Agent A] Block:           ${receipt.blockNumber}`)

  // Parse TaskPosted event from receipt logs to get the on-chain taskId
  const taskPostedTopic = TASK_REGISTRY_ABI.find(e => e.name === "TaskPosted")
  for (const log of receipt.logs) {
    try {
      const decoded = (await import("viem")).decodeEventLog({
        abi:    [taskPostedTopic] as any,
        data:   log.data,
        topics: log.topics,
      }) as any
      const taskId = decoded.args.taskId as `0x${string}`
      console.log(`[Agent A] taskId: ${taskId}`)
      return taskId
    } catch {
      // not this log, continue
    }
  }

  throw new Error("[Agent A] TaskPosted event not found in receipt — was the contract called correctly?")
}

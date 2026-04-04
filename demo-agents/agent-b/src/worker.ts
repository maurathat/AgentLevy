// Step 3 — Agent B executes the task off-chain and stores the result.
// Result + its hash are stored to Swarm / IPFS / 0G.
// The hash is what gets submitted on-chain as the commitment.

import { keccak256, toBytes } from "viem"
import { TaskSpec } from "../../shared/types"
import { TASKS } from "./tasks"
import { PINATA_JWT } from "../../shared/config"
import axios from "axios"

// ─── Execute + store ──────────────────────────────────────────────────────────

export interface WorkResult {
  result: unknown           // the raw deliverable (JSON, string, etc.)
  resultHash: `0x${string}` // keccak256 of JSON.stringify(result)
  storageURI: string        // where the result is stored (ipfs:// or local://)
}

export async function executeAndStore(spec: TaskSpec): Promise<WorkResult> {
  // 1. Find the matching task handler
  const taskDef = Object.values(TASKS).find(
    def => def.verificationType === spec.verification.type
  )
  if (!taskDef) {
    throw new Error(`[Agent B] No handler for verification type: ${spec.verification.type}`)
  }

  // 2. Execute the task
  console.log(`[Agent B] Executing task: ${spec.id}`)
  const result = await taskDef.execute()
  console.log(`[Agent B] Task executed successfully`)

  // 3. Hash the result
  const serialised = JSON.stringify(result)
  const resultHash = keccak256(toBytes(serialised))
  console.log(`[Agent B] Result hash: ${resultHash}`)

  // 4. Store result (IPFS via Pinata, or local mock)
  const storageURI = await storeResult(spec.id, result)
  console.log(`[Agent B] Result stored: ${storageURI}`)

  return { result, resultHash, storageURI }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function storeResult(taskId: string, result: unknown): Promise<string> {
  if (PINATA_JWT) {
    return storeToIPFS(taskId, result)
  }
  // Local mock: just log it and return a fake URI
  return storeMock(taskId, result)
}

async function storeToIPFS(taskId: string, result: unknown): Promise<string> {
  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    { pinataContent: result, pinataMetadata: { name: `task-${taskId}` } },
    { headers: { Authorization: `Bearer ${PINATA_JWT}` } }
  )
  return `ipfs://${res.data.IpfsHash}`
}

function storeMock(taskId: string, result: unknown): string {
  // In-memory mock store — fine for Phase 1 demos
  mockStore[taskId] = result
  console.log(`[Agent B] (mock) Result stored in memory for task ${taskId}`)
  return `local://${taskId}`
}

// Exported so Agent A can query it in Phase 1 without IPFS
export const mockStore: Record<string, unknown> = {}

// Step 4 — Agent B submits the resultHash + proof to the Verifier contract.
// The contract checks the hash against the spec criteria and triggers settlement.
// TEE attestation is optional in Phase 1 (empty bytes) — required in Phase 3.

import { publicClient, getWalletClient } from "../../shared/config"
import { CONTRACT_ADDRESSES, VERIFIER_ABI } from "../../shared/contracts"
import { ProofPayload } from "../../shared/types"
import { WorkResult } from "./worker"

// ─── Build proof payload ──────────────────────────────────────────────────────

export function buildProofPayload(
  taskId: `0x${string}`,
  workResult: WorkResult,
  attestation: `0x${string}` = "0x" // empty in Phase 1, TEE-signed in Phase 3
): ProofPayload {
  const walletClient = getWalletClient("B")
  return {
    taskId,
    executorAddress: walletClient.account.address,
    resultHash: workResult.resultHash,
    resultStorageURI: workResult.storageURI,
    attestation,
    submittedAt: Date.now(),
  }
}

// ─── Submit proof to Verifier contract ───────────────────────────────────────

export async function submitProof(proof: ProofPayload): Promise<boolean> {
  console.log(`[Agent B] Submitting proof for task: ${proof.taskId}`)
  console.log(`[Agent B] Result hash: ${proof.resultHash}`)

  const walletClient = getWalletClient("B")

  const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.verifier,
    abi: VERIFIER_ABI,
    functionName: "submitProof",
    args: [
      proof.taskId as `0x${string}`,
      proof.resultHash as `0x${string}`,
      (proof.attestation ?? "0x") as `0x${string}`,
    ],
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log(`[Agent B] Proof submitted — tx: ${txHash}`)
  console.log(`[Agent B] Block:            ${receipt.blockNumber}`)

  // Read back the verification result
  const [verified, passed] = await publicClient.readContract({
    address: CONTRACT_ADDRESSES.verifier,
    abi: VERIFIER_ABI,
    functionName: "getVerificationResult",
    args: [proof.taskId as `0x${string}`],
  })

  console.log(`[Agent B] Verified: ${verified}, Passed: ${passed}`)
  return passed
}

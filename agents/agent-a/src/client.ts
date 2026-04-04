// Agent A orchestrator — runs the full 5-step flow end to end:
// 1. post   → fetch spec from B, post task + funds on-chain
// 2. agree  → wait for Agent B to claim (handshake)
// 3. work   → Agent B executes off-chain (Agent A just waits)
// 4. prove  → Agent B submits proof (Agent A monitors)
// 5. pay    → validate result, confirm treasury settlement

import { fetchTaskSpec, postTask } from "./postTask"
import { waitForClaim } from "./handshake"
import { waitForVerification, confirmSettlement } from "./validate"
import { payAndExecute } from "./pay402"

async function main() {
  const taskName = process.argv[2] ?? "product_scrape"
  console.log(`\n[Agent A] Starting flow for task: ${taskName}`)
  console.log("─".repeat(50))

  // ── Step 1: Post ────────────────────────────────────────────────────────────
  console.log("\n[Step 1] Fetching task spec from Agent B...")
  const spec = await fetchTaskSpec(taskName)
  console.log(`[Step 1] Spec id: ${spec.id}`)

  console.log("\n[Step 1] Posting task on-chain...")
  const taskId = await postTask(spec)
  console.log(`[Step 1] Task posted — taskId: ${taskId}`)

  // ── Step 2: Agree ───────────────────────────────────────────────────────────
  console.log("\n[Step 2] Waiting for Agent B to claim...")
  const claim = await waitForClaim(taskId)
  console.log(`[Step 2] Agreement locked — executor: ${claim.executor}`)

  // ── Step 3: Work ────────────────────────────────────────────────────────────
  console.log("\n[Step 3] Triggering Agent B execution via x402...")
  const executionResult = await payAndExecute(taskName, { taskId })
  console.log("[Step 3] Agent B delivered result:", executionResult)

  // ── Step 4 + 5: Prove + Pay ─────────────────────────────────────────────────
  console.log("\n[Step 4] Waiting for verification result...")
  const { passed } = await waitForVerification(taskId)

  console.log("\n[Step 5] Confirming settlement...")
  const settlement = await confirmSettlement(taskId)

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(50))
  if (passed) {
    console.log("[Agent A] Flow complete — task PASSED, Agent B paid")
    if (settlement) {
      console.log(`[Agent A] Payment sent to: ${settlement.recipient}`)
      console.log(`[Agent A] Amount: ${settlement.amount.toString()} USDC`)
    }
  } else {
    console.log("[Agent A] Flow complete — task FAILED or timed out, funds refunded")
    if (settlement) {
      console.log(`[Agent A] Refund sent to: ${settlement.recipient}`)
    }
  }
}

main().catch(err => {
  console.error("[Agent A] Fatal error:", err)
  process.exit(1)
})

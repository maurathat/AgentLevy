// Phase 2 server — identical routes to server.ts but POST /execute is x402 gated.
// Run with: ts-node agent-b/src/server-x402.ts
// Requires env vars: AGENT_B_ADDRESS, AGENT_B_EXECUTION_FEE (optional, defaults to "0.01")

import express, { Request, Response } from "express"
import { AGENT_B_PORT }               from "../../shared/config"
import { TASKS }                      from "./tasks"
import { x402Middleware }             from "./x402"

const AGENT_B_ADDRESS  = (process.env.AGENT_B_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`
const EXECUTION_FEE    = process.env.AGENT_B_EXECUTION_FEE ?? "0.01"

const app = express()
app.use(express.json())

// ─── GET /tasks — free ────────────────────────────────────────────────────────

app.get("/tasks", (_req: Request, res: Response) => {
  const available = Object.entries(TASKS).map(([key, def]) => ({
    name:             key,
    description:      def.description,
    verificationType: def.verificationType,
    spec:             def.buildSpec(),
  }))
  res.json({ tasks: available })
})

// ─── GET /tasks/:name/spec — free ─────────────────────────────────────────────

app.get("/tasks/:name/spec", (req: Request, res: Response) => {
  const def = TASKS[req.params.name]
  if (!def) {
    res.status(404).json({ error: `Task '${req.params.name}' not found` })
    return
  }
  res.json({ spec: def.buildSpec() })
})

// ─── POST /tasks/:name/execute — x402 gated ──────────────────────────────────
// Agent A must:
//   1. Call this endpoint (gets 402 back with payment descriptor)
//   2. Send USDC to payTo on Coston2
//   3. Retry with X-Payment: base64(JSON(X402Receipt)) header

app.post(
  "/tasks/:name/execute",
  x402Middleware({
    amount:      EXECUTION_FEE,
    payTo:       AGENT_B_ADDRESS,
    description: "Agent B task execution fee (Coston2 USDC)",
  }),
  async (req: Request, res: Response) => {
    const def = TASKS[req.params.name]
    if (!def) {
      res.status(404).json({ error: `Task '${req.params.name}' not found` })
      return
    }
    try {
      const result = await def.execute()
      res.json({
        taskId:     req.body.taskId ?? "no-task-id",
        result,
        executedAt: Date.now(),
      })
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  }
)

// ─── GET /health ──────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", agent: "B", phase: 2, paymentGate: "x402" })
})

// ─── Start ────────────────────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(AGENT_B_PORT, () => {
    console.log(`[Agent B] x402 server on http://localhost:${AGENT_B_PORT}`)
    console.log(`[Agent B] Execution fee : ${EXECUTION_FEE} USDC`)
    console.log(`[Agent B] Pay-to address: ${AGENT_B_ADDRESS}`)
  })
}

export default app

// Phase 1: plain HTTP server — no payment, no blockchain
// Agent B exposes its available tasks and delivers results on request.
// Phase 2 (server-x402.ts) will add the x402 payment gate on top of this.

import express, { Request, Response } from "express"
import { AGENT_B_PORT } from "../../shared/config"
import { TASKS } from "./tasks"
import { TaskSpec } from "../../shared/types"

const app = express()
app.use(express.json())

// ─── GET /tasks ───────────────────────────────────────────────────────────────
// Returns the list of tasks Agent B can execute + their specs.
// Agent A calls this to discover what B offers.

app.get("/tasks", (_req: Request, res: Response) => {
  const available = Object.entries(TASKS).map(([key, def]) => ({
    name: key,
    description: def.description,
    verificationType: def.verificationType,
    spec: def.buildSpec(),
  }))
  res.json({ tasks: available })
})

// ─── GET /tasks/:name/spec ────────────────────────────────────────────────────
// Returns the full TaskSpec for a specific task.
// Agent A uses this to post the task on-chain.

app.get("/tasks/:name/spec", (req: Request, res: Response) => {
  const def = TASKS[req.params.name]
  if (!def) {
    res.status(404).json({ error: `Task '${req.params.name}' not found` })
    return
  }
  const spec: TaskSpec = def.buildSpec()
  res.json({ spec })
})

// ─── POST /tasks/:name/execute ────────────────────────────────────────────────
// Agent B executes the task and returns the raw result.
// In Phase 2 this endpoint will require a valid escrow_id in headers.
// Body: { taskId: string, escrowId?: string }

app.post("/tasks/:name/execute", async (req: Request, res: Response) => {
  const def = TASKS[req.params.name]
  if (!def) {
    res.status(404).json({ error: `Task '${req.params.name}' not found` })
    return
  }

  try {
    const result = await def.execute()
    res.json({
      taskId: req.body.taskId ?? "no-task-id",
      result,
      executedAt: Date.now(),
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ─── GET /health ──────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", agent: "B", phase: 1 })
})

// ─── Start ────────────────────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(AGENT_B_PORT, () => {
    console.log(`Agent B listening on http://localhost:${AGENT_B_PORT}`)
  })
}

export default app

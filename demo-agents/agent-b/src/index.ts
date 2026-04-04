// Agent B entry point — starts the x402 server and watches for on-chain tasks.
// Run with: ts-node agent-b/src/index.ts

import app             from "./server-x402"
import { watchAndClaim } from "./handshake"
import { AGENT_B_PORT }  from "../../shared/config"

app.listen(AGENT_B_PORT, () => {
  console.log(`[Agent B] x402 server on http://localhost:${AGENT_B_PORT}`)
})

watchAndClaim((taskId, spec) => {
  console.log(`[Agent B] Claimed task ${taskId} — spec: ${spec.description}`)
})

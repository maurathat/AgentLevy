# AgentLevy — Demo

## What you're about to see

An end-to-end agent-to-agent transaction where payment only releases after verified task completion. No trust required between parties. No human in the loop.

## The flow

1. **Agent A** requests a sentiment analysis task and receives HTTP 402 with a committed task specification
2. **Agent A** pays — funds escrow in a Protocol Managed Wallet on Flare (nobody controls this wallet)
3. **Agent B** completes the task and submits output
4. **TEE** verifies the output against the spec that was committed at payment time — neither party can change this spec after escrow
5. **Treasury** auto-settles: task fee goes to Agent B, a 0.5% levy routes to the protocol treasury
6. **FDC** records an immutable attestation on-chain via Flare Data Connector
7. **Taxai dashboard** shows the settlement record in real time

## Run it yourself

```bash
# Terminal 1 — start the facilitator
node sdk/x402Facilitator.js

# Terminal 2 — run the demo
node sdk/agentWallet.js --demo

# Terminal 3 — watch it in the dashboard
cd dashboard && npm run dev
```

## Why this matters

Every existing agent payment protocol (x402, Handshake58, ACP) assumes good faith — Agent A pays, Agent B delivers, and if the work is bad, too late. AgentLevy is the first protocol where neither party can cheat after payment is locked. The spec is committed. The TEE is the arbiter. The levy is architectural.

## Built with

Flare Network (Coston2) · Flare Data Connector · Flare TEE · XRPL · RLUSD · x402

## Team

Built at ETHGlobal Cannes, April 3–5, 2026.

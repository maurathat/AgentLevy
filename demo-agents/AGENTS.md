# AgentLevy — How the Agents Work

The agents module is the off-chain brain of the protocol. Two autonomous TypeScript programs act as buyer and seller, using a combination of HTTP and blockchain transactions to negotiate, pay for, execute, and settle tasks — with no human involvement.

---

## The Two Agents

### Agent A — The Buyer
Runs as a one-shot script. Given a task name, it:
- Asks Agent B what the task looks like (spec, price, verification rules)
- Locks USDT0 into the `TaskRegistry` contract on-chain
- Waits for Agent B to claim the task on-chain
- Pays Agent B's execution fee via x402
- Receives the result
- Waits for the on-chain proof and settlement confirmation

### Agent B — The Seller
Runs as a persistent server. It:
- Exposes HTTP endpoints advertising what tasks it can do
- Watches the blockchain for new posted tasks and auto-claims ones it can handle
- Gates task execution behind an x402 payment check
- Executes the task, hashes the result, stores it (IPFS or local mock)
- Submits the result hash as a proof to the `TaskRegistry` contract
- Gets paid automatically when the contract verifies the proof

---

## How They Communicate

They use **two channels simultaneously**:

**HTTP** — fast, off-chain
- Agent A asks Agent B for a task spec
- Agent A sends the x402 payment and gets the result back

**Blockchain (Coston2)** — trustless, on-chain
- Agent A locks funds via `TaskRegistry.postTask()`
- Agent B claims the work via `TaskRegistry.claimTask()`
- Agent B proves delivery via `TaskRegistry.submitProof()`
- Contract auto-pays Agent B on a valid proof

Neither agent can cheat — the contract holds the money and only releases it when Agent B delivers a valid result hash.

---

## The x402 Payment Protocol

x402 is how Agent A pays Agent B for execution **before** receiving the result. It works like this:

```
1. Agent A calls POST /tasks/product_scrape/execute
2. Agent B replies: 402 Payment Required + { payTo, amount }
3. Agent A sends USDT0 on-chain to Agent B's address
4. Agent A retries the request with the tx hash in the X-Payment header
5. Agent B verifies the USDT0 Transfer event on Coston2
6. Agent B executes the task and returns the result
```

The key insight: Agent B never trusts Agent A's word — it reads the actual blockchain transaction to confirm payment before doing any work.

---

## The Full Flow Step by Step

```
Agent A                         Chain                      Agent B
   │                               │                          │
   │── GET /tasks/spec ───────────────────────────────────►   │
   │◄─ TaskSpec (price, schema) ──────────────────────────    │
   │                               │                          │
   │── approve USDT0 ──────────►    │                          │
   │── postTask() ────────────►    │ TaskPosted event         │
   │                               │ ◄─── watchEvent ─────────│
   │                               │      claimTask() ────────►
   │                               │ TaskClaimed event        │
   │◄─── waitForClaim() ───────    │                          │
   │                               │                          │
   │── POST /execute ──────────────────────────────────────►  │
   │◄─ 402 + payTo ────────────────────────────────────────   │
   │── send USDT0 tx ──────────►    │                          │
   │── POST /execute + txHash ─────────────────────────────►  │
   │                               │ ◄─ verifyOnChain()       │
   │◄─ 200 { result } ─────────────────────────────────────   │
   │                               │      submitProof() ───►  │
   │                               │ TaskSettled + pay B      │
   │◄─── confirmSettlement() ──    │                          │
```

---

## Key Files at a Glance

| File | Role |
|---|---|
| [agent-a/src/client.ts](agent-a/src/client.ts) | Master orchestrator — runs all 5 steps in sequence |
| [agent-b/src/index.ts](agent-b/src/index.ts) | Starts server + blockchain watcher together |
| [agent-b/src/x402.ts](agent-b/src/x402.ts) | Payment middleware — issues 402, verifies on-chain |
| [agent-b/src/tasks.ts](agent-b/src/tasks.ts) | What Agent B can do — add new tasks here |
| [agent-b/src/worker.ts](agent-b/src/worker.ts) | Executes tasks, hashes results, stores to IPFS/mock |
| [shared/contracts.ts](shared/contracts.ts) | ABIs + addresses for all on-chain interactions |

---

## What Makes It Trustless

- Agent A can't withhold payment — funds are locked in the contract before Agent B does any work
- Agent B can't fake a result — the contract only pays out when a valid result hash is submitted
- Agent B can't reuse a payment — x402 tracks seen tx hashes in memory (Redis in Phase 3)
- Neither party controls settlement — the `TaskRegistry` contract handles it automatically

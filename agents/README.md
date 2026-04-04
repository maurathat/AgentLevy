# AgentLevy — Agents

This directory contains the two off-chain agents that power the AgentLevy protocol, plus the shared config, types, and contract ABIs they both depend on.

---

## Overview

AgentLevy enables autonomous agent-to-agent commerce on Flare Coston2. Two agents negotiate, pay, execute, and settle tasks entirely on-chain — no human in the loop.

```
Agent A (buyer)                          Agent B (seller)
──────────────                           ────────────────
1. Fetch task spec    ──── HTTP ────►    Serve task spec
2. Post task + USDC   ──── chain ───►    TaskRegistry.postTask()
3. Wait for claim     ◄─── chain ────    TaskRegistry.claimTask()
4. Pay x402 fee       ──── chain ───►    Verify USDC transfer
5. Receive result     ◄─── HTTP ────     Execute task + return result
6. Wait for proof     ◄─── chain ────    submitProof(resultHash)
7. Confirm settlement ◄─── chain ────    Treasury releases USDC to B
```

---

## Directory Structure

```
agents/
├── agent-a/src/
│   ├── client.ts        # Orchestrator — runs the full 5-step flow
│   ├── postTask.ts      # Step 1: fetch spec, approve USDC, post on-chain
│   ├── handshake.ts     # Step 2: poll for Agent B's on-chain claim
│   ├── pay402.ts        # Step 3: x402 payment + task execution trigger
│   └── validate.ts      # Steps 4-5: poll verification, confirm settlement
│
├── agent-b/src/
│   ├── index.ts         # Entry point — starts server + on-chain watcher
│   ├── server.ts        # Phase 1: plain HTTP server (no payment gate)
│   ├── server-x402.ts   # Phase 2: x402 payment-gated server
│   ├── x402.ts          # Middleware: issues 402, verifies USDC on Coston2
│   ├── handshake.ts     # Watches TaskRegistry, auto-claims matching tasks
│   ├── tasks.ts         # Task definitions (what B can execute + specs)
│   ├── worker.ts        # Executes tasks, hashes results, stores to IPFS/mock
│   └── submitProof.ts   # Submits resultHash to Verifier contract
│
└── shared/
    ├── config.ts        # Viem clients, wallet helpers, env vars
    ├── contracts.ts     # Contract addresses + ABIs (TaskRegistry, Verifier, ERC20)
    └── types.ts         # Shared TypeScript types (TaskSpec, ProofPayload, events)
```

---

## Prerequisites

- Node.js 22 LTS (`node --version` should show `v22.x.x`)
- Two funded Coston2 wallets (Agent A needs C2FLR for gas + USDC for task payments)
- Contracts deployed (see [Deploy](#deploy) section)

---

## Setup

### 1. Install dependencies

```bash
cd agents
npm install
```

### 2. Create `agents/.env`

```bash
cp .env.example .env
```

Fill in all values:

```env
FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc

# Two separate wallets — generate with the command below
AGENT_A_PRIVATE_KEY=0x...
AGENT_B_PRIVATE_KEY=0x...

# From contract deployment
TASK_REGISTRY_ADDRESS=0x...
VERIFIER_ADDRESS=0x...         # same address as TASK_REGISTRY_ADDRESS
TREASURY_ADDRESS=0x...
USDC_ADDRESS=0x...             # MockUSDC address on Coston2

AGENT_B_PORT=3001
AGENT_B_URL=http://localhost:3001

# Leave blank to use local mock storage (Phase 1)
PINATA_JWT=
```

### 3. Generate wallet keys

Run from the project root (where viem is installed):

```bash
node -e "
const {privateKeyToAccount} = require('viem/accounts');
const crypto = require('crypto');
const keyA = '0x' + crypto.randomBytes(32).toString('hex');
const keyB = '0x' + crypto.randomBytes(32).toString('hex');
console.log('AGENT_A_PRIVATE_KEY=' + keyA);
console.log('Agent A address:', privateKeyToAccount(keyA).address);
console.log('AGENT_B_PRIVATE_KEY=' + keyB);
console.log('Agent B address:', privateKeyToAccount(keyB).address);
"
```

### 4. Fund Agent A

- Get **C2FLR** (gas) from `https://faucet.towolabs.com` → select Coston2 → paste Agent A's address
- Get **USDC** by running the mock USDC mint script after deployment (see below)

---

## Deploy

Contracts are deployed from the **project root** (not this directory).

```bash
cd ..   # go to AgentLevy root

# Deploy Treasury + TaskRegistry
npx hardhat run scripts/deploy.js --network coston2

# Deploy MockUSDC + mint 1000 USDC to your deployer wallet
npx hardhat run scripts/deploy-mock-usdc.js --network coston2
```

Both scripts print the addresses to add to `agents/.env`. Deployment info is saved to `../deployments/coston2.json`.

> `VERIFIER_ADDRESS` is the same contract as `TASK_REGISTRY_ADDRESS` — the `TaskRegistry` implements both interfaces.

---

## Running

Open two terminals.

**Terminal 1 — Start Agent B:**
```bash
cd agents
npm run dev:agent-b
```

Agent B starts the x402-gated HTTP server on port 3001 and begins watching the `TaskRegistry` for posted tasks to claim.

**Terminal 2 — Run Agent A:**
```bash
cd agents
npm run dev:agent-a product_scrape
```

Agent A runs the full 5-step flow for the `product_scrape` task and exits when complete.

### Available tasks

| Task name | Description | Payment |
|---|---|---|
| `product_scrape` | Returns 10 mock product listings as JSON | 0.05 USDC |

---

## Testing

Tests cover Agent B's server routes, task definitions, and worker execution. No contracts or network required — tests run entirely locally.

```bash
cd agents
npm test
```

### Test files

| File | What it tests |
|---|---|
| `agent-b/src/__tests__/server.test.ts` | All HTTP routes (`/health`, `/tasks`, `/tasks/:name/spec`, `/tasks/:name/execute`) |
| `agent-b/src/__tests__/tasks.test.ts` | Task spec shape, payment overrides, unique IDs, execute output |
| `agent-b/src/__tests__/worker.test.ts` | `executeAndStore()` — result hash format, mock storage, error handling |

---

## How x402 Payment Works

x402 is a standard for HTTP-native micropayments. The flow for each task execution:

```
Agent A                                   Agent B
   │                                         │
   │  POST /tasks/product_scrape/execute     │
   │ ───────────────────────────────────►    │
   │                                         │
   │  ◄── 402 Payment Required ──────────    │
   │      { accepts: [{ payTo, amount }] }   │
   │                                         │
   │  (sends USDC on Coston2)                │
   │                                         │
   │  POST /tasks/product_scrape/execute     │
   │  X-Payment: base64(receipt + txHash)    │
   │ ───────────────────────────────────►    │
   │                              (verifies USDC transfer on-chain)
   │                                         │
   │  ◄── 200 { result: [...] } ──────────   │
```

Agent B verifies the payment by reading the actual `Transfer` event from the Coston2 transaction — no trusted intermediary.

---

## Adding a New Task

1. Add a new entry to `agent-b/src/tasks.ts` implementing the `TaskDefinition` interface:

```typescript
export const TASKS: Record<string, TaskDefinition> = {
  // existing tasks...

  my_new_task: {
    name: "my_new_task",
    description: "What this task does",
    verificationType: "json_schema",

    buildSpec() { /* return a TaskSpec */ },
    async execute() { /* return the result */ },
  }
}
```

2. That's it — the server, worker, and x402 middleware all pick it up automatically via `TASKS`.

---

## Phase Roadmap

| Phase | Status | What's active |
|---|---|---|
| Phase 1 | Done | Plain HTTP, mock data, local result storage |
| Phase 2 | Done | x402 payment gate, on-chain USDC verification |
| Phase 3 | Planned | TEE attestation, real task execution, IPFS storage |

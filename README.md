# AgentLevy Protocol

> The atomic trust layer for agent-to-agent commerce.

**ETHGlobal Cannes 2026 · Built on Flare Network + XRP Ledger**

---

## The problem

AI agents are transacting with each other at scale. Every existing payment protocol — x402, Handshake58, OpenAI's ACP — assumes good faith between parties. The Publisher Agent pays, the Worker Agent delivers, and if the output is garbage, the money is already gone.

This creates three failure modes that will get worse as agent commerce grows:

- **Publisher Agent changes the goalposts** — demands more after payment, claims the work didn't match the brief
- **Worker Agent delivers junk** — collects payment for low-quality or incomplete output
- **No audit trail** — nobody can prove what was agreed, what was delivered, or whether it met the bar

AgentLevy solves all three by adding a trust layer that x402 doesn't have: verified task completion as a prerequisite for payment release.

---

## What it does

AgentLevy is an **x402 payment facilitator** with one critical addition: a committed task specification, TEE-verified output quality, and a Protocol Managed Wallet that won't release funds until attestation confirms the work was done correctly.

```
Publisher Agent requests task
  → HTTP 402 returned with committed spec hash
Publisher Agent pays
  → Funds escrow in Flare PMW (nobody controls this wallet)
Worker Agent completes task
  → Submits output to facilitator
TEE verifies output against committed spec
  → Deterministic quality checks, no interpretation
Attestation passes
  → Task fee releases to Worker Agent
  → 0.5% levy routes to protocol treasury (architectural, not enforced)
  → FDC records immutable proof on-chain
```

**One sentence:** The Publisher Agent can't change the goalposts. The Worker Agent knows exactly what they're evaluated against. The TEE is the neutral arbiter. The levy is a consequence of attestation, not a separate enforcement mechanism.

---

## How it differs from existing protocols

| | x402 | Handshake58 | ACP (OpenAI) | **AgentLevy** |
|---|---|---|---|---|
| Task verification | None | None | Draft spec | **TEE quality checks** |
| Spec commitment | None | None | Partial | **Hash committed at escrow** |
| Payment guarantee | Signature-based | Channel-based | Stripe | **PMW escrow + attestation** |
| Audit trail | Tx receipt | Channel state | Stripe logs | **On-chain attestation via FDC** |
| Social mandate | None | None | None | **Architectural levy for retraining** |

### Standard x402 vs AgentLevy x402

<p align="center">
  <img src="docs/x402-comparison.svg" alt="x402 vs AgentLevy flow comparison" width="680"/>
</p>

---

## Architecture

### Task spec registry

Five standard service types with machine-readable specifications: `sentiment-analysis`, `data-extraction`, `code-review`, `translation`, `data-validation`. Each spec defines input/output schemas, quality criteria with specific thresholds, and a list of deterministic checks the TEE runs.

The spec hash is computed from the full specification via SHA-256 and committed on-chain at escrow time. Neither party can modify it after payment is locked.

### Treasury contract (Flare Coston2)

`Treasury.sol` handles both the per-task escrow and the accumulated levy treasury in a single contract. Key functions:

- `escrowPayment()` — Publisher Agent locks funds with a committed spec hash
- `submitAttestation()` — TEE submits verification result, auto-settles if passed
- `_settle()` — atomic: task fee to Worker Agent, levy to treasury, event emitted

The contract is designed as a Protocol Managed Wallet — in production, the private key lives inside a Flare TEE controlled by validator consensus. Nobody holds the key.

### x402 facilitator

The facilitator sits between the Publisher Agent and the Worker Agent, implementing the x402 HTTP 402 flow with AgentLevy's trust layer on top. Endpoints:

- `GET /services` — discover available service types and pricing
- `GET /task/:serviceId` — returns 402 with payment instructions and committed spec
- `POST /pay` — escrow payment in Treasury.sol
- `POST /pay/xrpl` — prepares XRPL Smart Account payment instructions + memo
- `POST /pay/xrpl/confirm` — relays validated XRPL payment proof to Flare
- `POST /submit` — Worker Agent submits output, TEE verifies, settlement triggered
- `GET /status/:taskId` — task status (also the FDC attestation endpoint)
- `GET /smart-account/:xrplAddress` — look up the mapped Flare Smart Account

### Flare Data Connector (FDC)

The FDC brings the TEE attestation on-chain using Web2Json attestation type. It queries the facilitator's `/status/:taskId` endpoint with an ABI signature of `(bool taskExists, string taskId, string status, uint256 completedAt)` and produces a Merkle proof that can be verified in the Treasury contract.

### Taxai dashboard

A React dashboard that reads `LevySettled` events from the Treasury contract via RPC. Shows total levy collected, treasury balance, tasks settled, and a full settlement history table with CSV export for audit.

---

## Project structure

```
contracts/
  Treasury.sol              Core Flare contract — escrow, levy, attestation

sdk/
  x402Facilitator.js        x402 HTTP facilitator with trust layer
  agentWallet.js            Agent wallet registration + demo simulation
  taskSpecRegistry.js       5 service types with deterministic verification

oracle/
  fdcVerify.js              Flare Data Connector attestation integration

dashboard/src/
  App.jsx                   Taxai React dashboard

scripts/
  deploy.js                 Hardhat deploy to Coston2

demo/
  README.md                 Demo walkthrough

.env.example                Environment variable template
```

---

## Quick start

```bash
# Clone and install
git clone https://github.com/maurathat/AgentLevy.git
cd AgentLevy && npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Add your private key (funded with C2FLR from faucet.towolabs.com)

# Deploy to Coston2
npx hardhat run scripts/deploy.js --network coston2
# Copy the printed TREASURY_ADDRESS into .env and VITE_TREASURY_ADDRESS

# Start the facilitator
node sdk/x402Facilitator.js

# Run the end-to-end demo (new terminal)
node sdk/agentWallet.js --demo

# Start the Taxai dashboard (new terminal)
cd dashboard && npm install && npm run dev
```

---

## Hackathon scope vs production

| Component | Hackathon | Production |
|---|---|---|
| TEE verification | Node.js deterministic checks | Flare AI Kit inside Intel TDX |
| FDC attestation | Simplified submission | Full Merkle proof with round finalization |
| Smart Accounts | Stubbed | XRPL payment triggers Flare escrow |
| Settlement currency | C2FLR (testnet) | RLUSD via XRPL |
| Treasury key | Deployer-held | PMW — validator consensus, nobody holds key |
| Levy governance | Owner-settable rate | Multi-stakeholder council |

The architecture is production-correct. The hackathon simplifies the trust hardware, not the trust model.

---

## Tech stack

- **Smart contracts:** Solidity 0.8.28, Hardhat, Flare Coston2 testnet
- **Trust layer:** Flare AI Kit (TEE), Flare Data Connector, Flare Protocol Managed Wallet
- **Settlement:** XRPL, RLUSD, xrpl.js
- **Facilitator:** Node.js, Express, ethers.js
- **Dashboard:** React, Vite, ethers.js
- **Development:** Claude Code with Flare AI Skills

---

## Environment variables

```bash
PRIVATE_KEY=               # Deployer private key (funded with C2FLR)
COSTON2_RPC=https://coston2-api.flare.network/ext/C/rpc
TREASURY_ADDRESS=          # Set after deploy
XRPL_WALLET_SEED=          # Agent wallet seed
XRPL_WSS=wss://s.altnet.rippletest.net:51233
AGENT_A_ADDRESS=           # Publisher Agent XRPL address
AGENT_B_ADDRESS=           # Worker Agent EVM address
OPERATOR_XRPL_ADDRESS=     # XRPL operator address that receives payment memos
MASTER_ACCOUNT_CONTROLLER_ADDRESS=
VERIFIER_URL_TESTNET=https://fdc-verifier-testnet.flare.network
VERIFIER_API_KEY_TESTNET=00000000-0000-0000-0000-000000000000
COSTON2_DA_LAYER_URL=https://fdc-da-layer-testnet.flare.network
PORT=3001
LEVY_BPS=50                # 50 basis points = 0.5%
FACILITATOR_URL=http://localhost:3001
VITE_TREASURY_ADDRESS=     # Same as TREASURY_ADDRESS
```

---

## License

MIT

---

Built at ETHGlobal Cannes 2026.

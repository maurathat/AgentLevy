# AgentLevy 3-Minute Talk Track Summary

## Core message

AgentLevy is the atomic trust layer for agent-to-agent commerce. It upgrades x402 from a payment request standard into a protocol for verifiable work transactions, so value is released only after machine-checkable completion.

## 4-slide outline

### Slide 1 — Problem + Solution

- agents can already pay
- they still cannot prove work before release
- the missing primitive is verified completion before value moves
- AgentLevy solves that with committed specs, escrow, verification, and proof

### Slide 2 — Protocol Description

- Publisher Agent requests a job
- receives x402-style payment challenge plus task spec and `specHash`
- funds are escrowed
- Worker Agent submits structured output
- verifier checks output against the exact committed spec
- settlement is recorded only if the result passes

### Slide 3 — Agent Demo

- 0G powers the agents
- Flare powers trust, escrow, and proof
- show `402`, `specHash`, escrow, submission, verification result, settlement
- prove the agents transact under fixed task terms, not post-payment good faith

### Slide 4 — Summary

- built: treasury, facilitator, task spec registry, verifier flow, dashboard, skill, ERC draft
- used: Flare, 0G, x402, Solidity, JavaScript/TypeScript, React, Express, Vite, ethers
- next: public protocol website, polished demo console, 0G iNFT UX, TEE-backed verifier path

## Tight spoken version

AgentLevy upgrades x402 into a protocol for verifiable work transactions. A Publisher Agent receives an x402-style payment challenge together with a machine-readable task spec and committed `specHash`. Funds are escrowed, the Worker Agent submits structured output, and settlement is recorded only if deterministic verification passes. For the hackathon, 0G powers the agents, Flare powers the trust layer, and the demo shows `402`, `specHash`, escrow, verification, and proof. The result is trustworthy agent commerce under rules both sides can trust.

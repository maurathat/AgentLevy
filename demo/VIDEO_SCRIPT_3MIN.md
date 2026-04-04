# AgentLevy 3-Minute Video Script

## Sequence

- Slide 1: problem + solution
- Slide 2: protocol description
- Slide 3: agent demo framing, then cut to live demo capture
- Slide 4: summary and close

## Slide 1 — 0:00 to 0:40

"AgentLevy is the atomic trust layer for agent-to-agent commerce."

"It upgrades x402 from a payment request standard into a protocol for verifiable work transactions."

"Today, agents can pay, but they still cannot prove that delivered work satisfied the agreed task before value is released."

"AgentLevy solves that by committing task terms before execution and tying settlement to verification."

## Slide 2 — 0:40 to 1:15

"In the AgentLevy flow, the Publisher Agent receives an x402-style payment challenge together with a machine-readable task spec and a committed spec hash."

"That spec defines the task, the expected output shape, the deterministic checks, and the threshold for successful completion."

"Payment is escrowed instead of being sent directly to the Worker Agent."

"The Worker Agent submits structured output, and settlement is recorded only if that output passes verification against the exact committed specification."

## Slide 3 — 1:15 to 2:20

"Now we cut to the live demo."

"Here, a 0G Publisher Agent requests a job and a 0G Worker Agent completes it."

"0G powers the agents. Flare powers the trust, escrow, and proof layer."

"During the demo, we show the `402` response, the committed `specHash`, the escrow step, the worker submission, the verification result, and the settlement record."

"The point is that both agents operate under fixed task terms, and value becomes claimable only after the machine-checkable bar is met."

## Slide 4 — 2:20 to 3:00

"What we built is real: a Treasury contract on Flare Coston2, an x402 facilitator, a task spec registry, a deterministic verifier flow, a dashboard scaffold, a public skill, and an ERC draft."

"We used Flare, 0G, x402, Solidity, JavaScript and TypeScript, React, Express, Vite, and ethers."

"Next is the public protocol website, a polished live demo console, 0G iNFT identity treatment in the UX, and the production path to TEE-backed attested verification."

"AgentLevy is not just about moving value between agents. It is about making agent work transactable under rules both sides can trust."

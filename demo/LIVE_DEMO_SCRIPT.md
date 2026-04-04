# AgentLevy Live Demo Script

## Goal

Deliver one clean story:

**0G agents can now use AgentLevy to transact through x402 without blind trust, and Flare verifies and settles the result.**

## Recommended live structure

### Part 1 — Problem setup

Say:

"Agent-to-agent payment protocols can request payment, but they still assume trust after payment. If the work is bad, the money is already gone."

"AgentLevy upgrades x402 by committing the evaluation standard before work starts and only unlocking value after verification."

### Part 2 — Introduce the actors

Say:

"In this demo we have two 0G agents."

- `0G Publisher Agent` posts a code review job
- `0G Worker Agent` accepts the job and completes it

"0G powers the agent side of the system. AgentLevy is the protocol they use to transact."

### Part 3 — Show the x402 happy path

Show:

- request for a job
- `402 Payment Required`
- returned `taskId`
- returned `specHash`

Say:

"This is the key moment. The job is now defined by a committed specification hash. The requester cannot quietly change the goalposts later."

### Part 4 — Show escrow on Flare

Show:

- payment action
- escrow transaction hash
- dashboard or console proof that the task is now escrowed

Say:

"Payment is not being sent directly to the worker. It is being locked in escrow on Flare until the work passes verification."

### Part 5 — Show the worker complete the task

Show:

- Worker Agent producing the code review output
- structured output fields such as file, line, severity, rule

Say:

"The worker is not being judged on a vague promise. It is being judged against a declared output structure and deterministic checks."

### Part 6 — Show verification and settlement

Show:

- submission to AgentLevy
- verification response
- attestation hash
- settlement event in the dashboard

Say:

"Now the output is verified against the committed spec. Once it passes, AgentLevy records the settlement and unlocks the worker's withdrawal."

"This is where Flare is critical: escrow, attested execution, and proof are part of the protocol, not an offchain promise."

### Part 7 — Show why this matters

Say:

"The result is a trustworthy x402 flow for agents. 0G provides the agent infrastructure. AgentLevy provides the transaction protocol. Flare provides the trust and settlement layer."

## Failure path insert

Use this after the success path and keep it under 30 seconds.

Say:

"The failure path is what proves this is not just a payment flow."

Show:

- a malformed or incomplete worker output
- verification failing
- no successful settlement

Say:

"If the work does not match the committed spec, value does not flow as if the job succeeded. That is the core difference between AgentLevy and a normal x402 payment request."

## Optional Smart Account appendix

Only mention this if asked or if the demo is stable.

Say:

"We also support an XRPL-triggered Smart Account path on Flare, but for the hackathon our main demo is the x402 happy path because it shows the protocol design most clearly."

## Closing line

Use one of these:

- "AgentLevy is x402 with committed specs and verified release."
- "0G powers the agents, AgentLevy gives them trustworthy commerce."
- "This is the trust layer agent economies are missing."

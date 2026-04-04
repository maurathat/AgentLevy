# Root README Editorial Brief

This file is the planning brief for the root [README.md](/Users/mauraclark/AgentLevy/README.md).

## Goal

The README should help a judge or developer understand AgentLevy in under 2 minutes.

It should answer:

- what is AgentLevy
- why does it matter
- how does it work
- why are 0G and Flare part of it
- how do I run the demo

## Recommended Top-Level README Structure

### 1. Title and one-line positioning

Use a line close to:

**AgentLevy is the atomic trust layer for agent-to-agent commerce.**

Optional support line:

**It upgrades x402 with committed specs, escrowed execution, and verified release.**

### 2. Problem

Keep this short.

Explain:

- existing agent payment flows assume trust after payment
- bad work can still get paid
- requesters and workers need a pre-committed acceptance contract

### 3. What AgentLevy does

Explain the flow:

- Publisher Agent requests task
- protocol returns `402` with `specHash`
- payment enters escrow
- Worker Agent submits output
- verifier checks against committed spec
- settlement is recorded only after successful verification

### 4. Why this is different

Compare:

- normal x402
- AgentLevy x402

Keep the comparison table and the diagram.

### 5. Why 0G and Flare

Use a sponsor-aware split:

- **0G** for agent runtime, agent workflow, iNFT identity, and optional storage for memory or task artifacts
- **Flare** for escrow, verification, attestation, treasury settlement, and onchain proof

### 6. Demo flow

Include the exact happy path used in the live demo:

- 0G Publisher Agent posts job
- Worker Agent takes job
- x402 `402` challenge
- escrow
- verification
- proof and settlement

### 7. What is in the repo

Keep the repo tree brief and focused on:

- treasury contract
- facilitator
- task spec registry
- dashboard
- demo kit
- shareable skill

### 8. Quick start

Make the demo runnable and honest.

### 9. Scope and honesty

State clearly:

- Smart Accounts are secondary for this hackathon demo
- the protocol currently targets deterministic, machine-verifiable tasks
- the demo uses the x402 happy path as the main proof

## Editorial Rules

- keep policy language secondary
- keep the product concrete
- emphasize proof over aspiration
- do not reintroduce the old token-tax thesis as the main narrative
- do not claim “any task”
- prefer “deterministic tasks with committed acceptance criteria”

## Phrases Worth Reusing

- `atomic trust layer for agent-to-agent commerce`
- `committed specs and verified release`
- `trust layer for agent commerce`
- `0G powers the agents`
- `Flare powers the escrow, verification, and proof layer`
- `payment is released only after verification`

## Companion Sources

- [README.md](/Users/mauraclark/AgentLevy/README.md)
- [demo/README.md](/Users/mauraclark/AgentLevy/demo/README.md)
- [demo/JOB_EXAMPLES.md](/Users/mauraclark/AgentLevy/demo/JOB_EXAMPLES.md)
- [openclaw/SKILL.md](/Users/mauraclark/AgentLevy/openclaw/SKILL.md)

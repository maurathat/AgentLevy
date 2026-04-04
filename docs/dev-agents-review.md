# `origin/dev:agents` Review

## Summary

The `agents` folder on `origin/dev` is useful as a **prototype reference** for the publisher/worker agent workflow, but it should **not** be merged into the current protocol as-is.

It is strongest as:

- a reference for the two-agent demo shape
- a reference for x402-gated worker execution
- a source of shared type ideas for specs, proofs, and agent interactions

It is weakest where it assumes an older contract architecture and a direct-payment flow that no longer matches `main`.

## What Is In `origin/dev:agents`

The folder contains a small TypeScript workspace with:

- `agent-a`: requester/orchestrator flow
- `agent-b`: worker server and x402-gated execution
- `shared`: config, contract ABIs, and types
- tests for the worker server and task execution
- a branch-local `agents/SKILL.md`

## What Looks Useful

### 1. Clear two-agent demo structure

The split between the Publisher Agent and the Worker Agent is easy to understand and maps well to the live demo story:

- Publisher Agent requests and pays
- Worker Agent advertises tasks and performs work

This is useful for the future demo console and for showing a real agent-to-agent interaction.

### 2. Good x402 worker-server pattern

`agent-b/src/server-x402.ts` and `agent-b/src/x402.ts` provide a clean prototype for:

- `GET /tasks`
- `GET /tasks/:name/spec`
- `POST /tasks/:name/execute`
- returning `402 Payment Required`
- retrying after payment proof

That structure is helpful for the public protocol page and for demoing how agents discover and consume work.

### 3. Helpful shared type vocabulary

`shared/types.ts` contains useful conceptual building blocks:

- `TaskSpec`
- `VerificationSpec`
- `ProofPayload`
- task state enums

These are especially helpful for documenting the protocol and for shaping a future machine-readable task manifest format.

### 4. It was built as an executable scaffold

The branch includes tests for:

- worker task definitions
- the HTTP server
- storage behavior

That makes it more credible than a pure design sketch.

## What Is Outdated Or Misaligned

### 1. Different contract architecture

The dev branch assumes separate contracts for:

- `TaskRegistry`
- `Verifier`
- `Treasury`

The current protocol on `main` is centered around the current `Treasury.sol` plus facilitator flow. Because of that, the old agents workspace does not line up with the repo's present execution model.

### 2. Direct-payment x402 path conflicts with current escrow model

The dev x402 flow has the Publisher Agent pay the Worker Agent directly in USDC after a `402` challenge.

That conflicts with the current AgentLevy design on `main`, where:

- payment is escrowed first
- verification gates release
- settlement is mediated by the protocol

So the transport idea is useful, but the payment path is not current.

### 3. Important parts are still stubbed

Several files contain placeholders or TODOs for critical protocol behavior, including:

- claim watching
- verification polling
- settlement confirmation
- event parsing

That means the dev branch is not a complete implementation of the present protocol.

### 4. The old skill text is now partially stale

The branch-local `agents/SKILL.md` is structurally useful, but some wording is no longer accurate against `main`, especially around settlement behavior and contract shape.

## Recommended Reuse Strategy

### Borrow

Reuse these ideas:

- the publisher/worker split
- the x402-gated worker server shape
- task discovery and spec endpoints
- shared spec/proof type vocabulary
- the overall agent demo choreography

### Do Not Reuse Directly

Do not adopt these pieces unchanged:

- old contract assumptions
- separate `TaskRegistry` / `Verifier` flow
- direct USDC payment model
- old skill wording as source of truth

## Best Use For The Current Project

The best role for `origin/dev:agents` is as a **design and UX reference** for:

- the lively demo console
- the public protocol page
- the downloadable agent skill flow
- a future publisher/worker agent layer on top of the current facilitator and treasury design

## Final Recommendation

Treat `origin/dev:agents` as a **mine-for-parts branch**, not a merge candidate.

The branch gives us a strong head start on:

- how to present agent roles
- how to expose task discovery/spec routes
- how to structure a demo-friendly x402 interaction

But the actual implementation should be adapted to the current `main` architecture rather than copied over wholesale.

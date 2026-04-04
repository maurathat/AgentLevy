# AgentLevy Run Of Show

## Main demo priorities

1. Show the **success path** first
2. Show the **failure path** briefly second
3. Keep Smart Accounts out of the critical path

## Primary happy path

- Job type: `code-review`
- Actors:
  - `0G Publisher Agent`
  - `0G Worker Agent`
- Required screens:
  - 402 response with `specHash`
  - escrow / task status
  - worker output
  - verification result
  - dashboard settlement view

## Failure path

Use a short bad submission with:

- missing required fields
- invalid severity value
- malformed schema

Expected result:

- verification fails
- no successful settlement message

## Pre-demo checklist

- facilitator starts cleanly
- contract is deployed and configured
- service specs are registered onchain
- dashboard points to the correct treasury address
- demo job inputs are prepared in advance
- Worker Agent output is deterministic enough to pass on the first take
- failure-case output is prepared as a saved payload

## Language checklist

Say:

- "committed spec"
- "escrow"
- "verified completion"
- "attested execution"
- "withdrawal unlocked"
- "onchain proof"

Avoid:

- "trustless" if the audience may challenge the TEE simplification
- "Worker Agent is paid immediately" unless you show the withdrawal step

## Backup plan

If the full live flow is unstable:

1. show the 402 response and committed spec
2. show a previously successful settlement in the dashboard
3. show the failure payload and explain the failure gate
4. use the comparison SVG to keep the story coherent

## One-sentence pitch

"0G powers the agents, AgentLevy upgrades x402, and Flare enforces trustworthy settlement."

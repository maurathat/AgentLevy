---
name: agentlevy
description: "Operational skill for agents that want to buy or complete work through AgentLevy, an x402-compatible protocol that escrows payment and releases it only after deterministic task verification."
version: "1.0.0"
author: "AgentLevy"
license: "MIT"
metadata:
  openclaw:
    requires:
      tools: ["web-fetch", "read"]
    websites:
      - "https://github.com/maurathat/AgentLevy"
---

# AgentLevy Skill

Use this skill when an agent needs to understand AgentLevy, discover available services, request paid work, complete paid work, or verify whether a task has settled.

## What AgentLevy Is

AgentLevy is a payment protocol for agent commerce built around one rule:

- payment is committed before work begins
- the evaluation standard is committed at the same time
- funds release only after the submitted work passes verification

AgentLevy follows the familiar x402 request flow, but adds:

- committed task specifications
- escrowed settlement
- deterministic verification before release
- an auditable settlement trail

This changes the trust model:

- the buyer cannot quietly change the requirements after payment
- the worker knows what standard they will be judged against
- the settlement layer releases funds only after verification

## When To Use This Skill

Use AgentLevy when you are:

- a requesting agent that needs to pay another agent for a defined task
- a worker agent that wants clear acceptance criteria before starting
- an orchestrator that wants verifiable task completion before payout
- an integration agent adapting an x402 flow to a verification-first protocol

Do not use this skill if:

- the task has no deterministic success criteria
- the parties want informal payment without escrow or verification
- the runtime cannot make HTTP requests to the facilitator

## Core Roles

- `Publisher Agent`: the requester or buyer
- `Worker Agent`: the worker or seller
- `Facilitator`: the HTTP service that handles quotes, escrow flow, and status
- `Treasury`: the settlement contract that escrows funds and releases them after verification
- `Verifier`: the trusted execution and attestation layer that checks submitted output

## Safety Rules

- Never assume a task is complete just because payment was initiated.
- Treat the returned `specHash` as the evaluation commitment for the task.
- Read the service specification before paying or submitting output.
- Do not invent contract addresses, task ids, or service ids.
- Do not claim a task has settled until the protocol reports a settled status.
- If verification fails, preserve the failure details and revise the output rather than pretending success.

## Success Condition

A task run through AgentLevy is successful when all of the following are true:

- the service exists and its specification was fetched
- a task quote was returned through the facilitator
- payment entered escrow
- Worker Agent submitted output that matches the declared service schema
- verification passed
- task status reached `settled`
- the settlement response returned an attestation or transaction reference

## Inputs You Need

Collect these before starting:

- facilitator base URL
- `serviceId`
- expected input size or item count if pricing depends on volume
- `agentB` address for Worker Agent settlement
- the actual work input or job payload

For XRPL-enabled flows you may also need:

- payer XRPL address
- operator payment destination
- memo or payment reference from the facilitator

## Service Discovery

Start here:

```http
GET {FACILITATOR_URL}/services
```

Use the response to learn:

- supported `serviceId` values
- pricing model
- levy basis points

If the agent needs the full evaluation rules for a service, fetch:

```http
GET {FACILITATOR_URL}/spec/{serviceId}
```

Read the specification before paying or before submitting work.

## Requester Flow

Use this flow when the agent is buying work.

### 1. Ask For The Task Quote

```http
GET {FACILITATOR_URL}/task/{serviceId}?items={count}
```

Expect an HTTP `402` response containing:

- `taskId`
- `serviceId`
- `specHash`
- pricing details
- payment instructions

Important:

- the `specHash` is the commitment
- once escrow is created, that evaluation standard should not be treated as mutable

### 2. Review Before Paying

Before sending payment:

- confirm the `serviceId` is the intended service
- inspect the spec if the task requirements matter to output shape or thresholds
- confirm the total due and the settlement method
- confirm the target worker address

### 3. Escrow Payment

For the direct facilitator path:

```http
POST {FACILITATOR_URL}/pay
Content-Type: application/json

{
  "taskId": "task-id-from-quote",
  "serviceId": "service-id",
  "agentB": "0xWorkerAddress",
  "inputItems": 100
}
```

Treat a successful response as:

- payment entered escrow
- Worker Agent may begin work
- the task should now be tracked by `taskId`

### 4. Monitor Status

```http
GET {FACILITATOR_URL}/status/{taskId}
```

Interpret the status conservatively:

- `escrowed`: payment locked, work may proceed
- `settled`: verification passed and release completed
- any non-settled state: do not assume delivery is complete

## Worker Flow

Use this flow when the agent is completing a paid task.

### 1. Read The Service Spec

Before doing the work:

```http
GET {FACILITATOR_URL}/spec/{serviceId}
```

Check:

- output schema
- deterministic checks
- scoring or threshold rules
- any volume or completeness requirements

### 2. Produce Output That Matches The Declared Shape

The worker should optimize for:

- schema correctness
- completeness
- valid value ranges
- consistency with the declared service type

Do not submit free-form output if the service expects structured JSON.

### 3. Submit The Result

```http
POST {FACILITATOR_URL}/submit
Content-Type: application/json

{
  "taskId": "task-id",
  "output": { }
}
```

If verification passes, expect the task to settle.

If verification fails:

- inspect the returned verification details
- identify which checks failed
- correct the output if resubmission is supported by the facilitator flow

## XRPL Smart Account Flow

Some deployments may support an XRPL-triggered payment route.

When this path is enabled, the requester flow usually becomes:

1. request the task quote
2. call the XRPL payment preparation endpoint
3. receive a payment reference or memo payload
4. send the XRPL payment with the exact returned memo
5. confirm the XRPL payment with the facilitator so it can relay settlement to the execution layer

Typical endpoints:

```http
POST {FACILITATOR_URL}/pay/xrpl
POST {FACILITATOR_URL}/pay/xrpl/confirm
GET  {FACILITATOR_URL}/smart-account/{xrplAddress}
```

Rules for this path:

- use the exact memo or payment reference returned by the facilitator
- do not modify encoded instruction data
- do not assume XRPL payment alone means escrow is complete
- wait for the facilitator confirmation response before treating the task as escrowed

## Recommended Agent Behavior

If an owner says:

- "Use AgentLevy to hire an agent"
  - fetch services
  - inspect the target service spec
  - request the task quote
  - pay only after confirming the worker and service

- "Use AgentLevy to complete this task"
  - fetch the service spec
  - shape the output to the declared schema
  - submit only when the output can pass deterministic checks

- "Check whether this AgentLevy task is done"
  - fetch status by `taskId`
  - report the current protocol status exactly

## Error Handling

- `402`: payment is required; inspect the quote body instead of treating this as a generic error
- `404`: service or task not found
- `400`: malformed request or missing fields
- `500`: facilitator or contract-side execution error

When errors happen:

- preserve the exact response body
- report the protocol state accurately
- do not fabricate a settlement result

## Minimal Integration Pattern

If your agent already understands x402, the simplest adaptation is:

1. treat the task quote as both payment guidance and verification commitment
2. read and preserve the returned `specHash`
3. use the facilitator payment route
4. have the worker submit structured output through the protocol
5. treat `settled` as the only final success state

## Output Expectations For Agents Using This Skill

When reporting back to a user or orchestrator, include:

- selected `serviceId`
- `taskId`
- whether payment is quoted, escrowed, or settled
- the latest status response
- any verification result if output was submitted

If the task is complete, include the attestation or settlement transaction reference when available.

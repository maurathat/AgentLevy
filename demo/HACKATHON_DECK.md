# AgentLevy Hackathon Deck

This is the final 4-slide deck for the narrated 3-minute hackathon video.

It is optimized for a hybrid sequence:

- Slide 1: problem + solution
- Slide 2: protocol description
- Slide 3: agent demo framing, then cut to live demo capture
- Slide 4: summary, tools used, and what is next

## Theme

- background: `#070B18`
- cyan: `#00D4FF`
- green: `#00E5A0`
- orange: `#FF6B35`
- purple: `#7B61FF`
- headings: `Georgia`
- body: `Calibri Light`

## Recommended sequence

- Slide 1: `0:00-0:40`
- Slide 2: `0:40-1:15`
- Slide 3 + live demo capture: `1:15-2:20`
- Slide 4: `2:20-3:00`

---

## Slide 1 - Problem + Solution

### Title

**Agents can already pay. They still cannot prove work before release.**

### Lead line

The gap is not discovery or pricing. It is protocol-level proof that delivered work satisfied the agreed task before value moves.

### On-slide cards

- **Publisher Agent risk**  
  The Publisher Agent can pay before they can prove the work satisfied the agreed task.

- **Worker Agent risk**  
  The Worker Agent still needs protection from briefs changing after work begins.

- **AgentLevy solution**  
  Commit task terms up front, escrow payment, verify output, then record settlement with proof.

### Winning line

**x402 requests payment. AgentLevy verifies completion before value becomes claimable.**

### Speaker notes

"AgentLevy is the atomic trust layer for agent-to-agent commerce. It upgrades x402 from a payment request standard into a protocol for verifiable work transactions. In most current agent payment flows, the hard part is not charging for access. It is proving that the delivered work actually satisfied the agreed task before value is released. If a Worker Agent submits low-quality or malformed output, the requester has little protocol-level protection. If the requester changes the brief after work begins, the worker has little protection either. AgentLevy solves that by committing the acceptance criteria before execution and tying settlement to verification."

---

## Slide 2 - Protocol Description

### Title

**Commit the task. Verify the output. Record settlement.**

### Lead line

One x402 flow, one machine-readable task spec, one settlement decision.

### Core flow

1. Publisher Agent requests a job.
2. AgentLevy returns an x402-style payment challenge with a machine-readable task spec and committed `specHash`.
3. Funds enter escrow on Flare instead of going directly to the Worker Agent.
4. Worker Agent submits structured output.
5. The verifier checks that output against the exact committed spec.
6. Treasury records settlement only if the result passes verification.

### Hackathon / production line

**Hackathon today:** deterministic protocol verifier  
**Production path:** attested protocol verifier in confidential compute / TEE-backed infrastructure

### Visual direction

- full-width: [agentlevy-workflow-slide.svg](/Users/mauraclark/AgentLevy/demo/agentlevy-workflow-slide.svg)

### Speaker notes

"In the AgentLevy flow, the Publisher Agent requests a job and receives an x402-style payment challenge together with a machine-readable task specification and a committed spec hash. That spec defines the task, the expected output shape, the deterministic checks, and the threshold for successful completion. Payment is escrowed instead of being sent directly to the Worker Agent. The Worker Agent completes the job and submits structured output. The protocol verifies the output against the exact committed specification. Only if the result passes verification does settlement get recorded and value become claimable."

---

## Slide 3 - Agent Demo

### Title

**Demo: Publisher Agent and Worker Agent transact under fixed task terms.**

### Lead line

0G powers the agents. Flare powers the trust, escrow, and proof layer.

### On-slide structure

- **Publisher Agent**
  - requests the job
  - receives `402`
  - gets committed `specHash`

- **Worker Agent**
  - completes the task
  - submits structured output
  - is judged against the exact committed spec

- **AgentLevy + Flare**
  - escrow funds
  - run deterministic verification
  - record settlement and proof

### During the live demo, show

- `402` response
- committed `specHash`
- escrow step
- worker submission
- verification result
- settlement record / claimable value

### Speaker notes

"For the hackathon, we demonstrate AgentLevy through an x402 happy path where 0G powers the agents and Flare powers the trust, escrow, and proof layer. Now we cut to the live demo. The Publisher Agent requests a job, the Worker Agent completes it, and the protocol verifies the result against the exact committed specification. What the judges should see is the `402` response, the committed `specHash`, the escrow step, the worker submission, the verification result, and the settlement record. The point of the demo is that both agents operate under committed task terms and produce an auditable settlement trail instead of relying on good faith."

---

## Slide 4 - Summary

### Title

**What we built, what we used, and what comes next.**

### Built now

- Treasury contract on Flare Coston2
- x402 facilitator
- task spec registry
- deterministic verifier flow
- dashboard scaffold
- public agent skill
- ERC draft

### Tools used

- Flare
- 0G
- x402
- Solidity
- JavaScript / TypeScript
- React
- Express
- Vite
- ethers.js

### What is next

- public protocol website
- live demo console polish
- 0G iNFT identity treatment in the UX
- production path to TEE-backed attested verification

### Closing line

**0G powers the agents. Flare powers the proof. AgentLevy makes agent commerce trustworthy.**

### Speaker notes

"What we built is real: a Treasury contract on Flare Coston2, an x402 facilitator, a task spec registry, a deterministic verifier flow, a dashboard scaffold, a public skill, and an ERC draft for the protocol shape. We used Flare, 0G, x402, Solidity, JavaScript and TypeScript, React, Express, Vite, and ethers. What comes next is the public protocol website, a polished live demo console, 0G iNFT identity treatment in the UX, and the production path toward TEE-backed attested verification. AgentLevy is not just about moving value between agents. It is about making agent work transactable under rules both sides can trust."

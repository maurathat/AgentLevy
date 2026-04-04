# Website Content Brief

This file defines the content and UX direction for the public website and live demo page.

## Goal

The website should serve two jobs:

1. explain the protocol publicly
2. support the live hackathon demo

## Routes

Recommended split:

- `/` public protocol page
- `/demo` live demo console

## Visual Direction

Use the visual system from [AgentLevy_Protocol_Hackathon_Deck.pptx](/Users/mauraclark/AgentLevy/documents/AgentLevy_Protocol_Hackathon_Deck.pptx):

- dark background
- strong white headlines
- cyan emphasis
- robot icon or badge treatment
- orange only for warnings or failure states

Do not reuse the older token-tax messaging from that deck.

## Route `/`: Public Protocol Page

### Hero

Goal:

- explain AgentLevy in one screen

Suggested headline:

**The atomic trust layer for agent-to-agent commerce.**

Suggested subhead:

AgentLevy upgrades x402 with committed specs, escrowed execution, and verified release. 0G powers the agents. Flare powers the escrow, verification, and proof.

Optional accent line:

**The missing trust layer for the agentic economy.**

Primary actions:

- `View Live Demo`
- `Download Agent Skill`

### Section: The Trust Gap

Explain:

- today an agent can ask for payment
- that does not prove the work was good
- AgentLevy fixes that with pre-committed acceptance criteria

### Section: How It Works

Show the flow:

1. request job
2. return `402`
3. commit `specHash`
4. escrow on Flare
5. worker submits output
6. verification runs
7. settlement is recorded

Use [x402-comparison.svg](/Users/mauraclark/AgentLevy/demo/x402-comparison.svg) or a refined version of it.

### Section: Why 0G

Explain:

- 0G provides the agent layer
- agents can have persistent identity and ownership through iNFT
- Worker and Publisher are 0G agents

### Section: Why Flare

Explain:

- escrow
- verification path
- proof
- settlement record

### Section: For Agents

This is where the public skill/download story lives.

Include:

- what the skill does
- how an agent uses the protocol
- service discovery
- spec fetch
- submit flow
- status check

Link to:

- [openclaw/SKILL.md](/Users/mauraclark/AgentLevy/openclaw/SKILL.md)

### Section: Protocol References

Include:

- treasury address
- facilitator URL
- available service types
- repo link

## Route `/demo`: Live Demo Console

### Top bar

Show:

- title
- active network
- contract address
- `Run Happy Path`
- `Run Failure Path`
- `Reset`

### Agent roster

Show two main cards:

- `0G Publisher Agent`
- `0G Worker Agent`

Optional fields:

- iNFT identity
- owner
- role
- verified jobs
- status

### Job board

Seeded jobs only.

Recommended examples:

- Solidity security triage
- structured data extraction

### Protocol timeline

This is the centerpiece.

Show:

- task request
- `402`
- `specHash`
- escrow
- submit
- verify
- settlement

### Proof drawer

Show:

- task ID
- spec hash
- tx hash
- verification result
- settlement record

### Failure contrast

Keep this smaller than the success path.

Show:

- failed verification
- no successful completion
- why the protocol matters

## Website Writing Rules

- keep the public page clear and declarative
- keep the demo page operational and lively
- use the deck's visual seriousness
- keep Smart Accounts as optional secondary material
- keep the main story on the x402 happy path

## Content Sources

Use:

- [README.md](/Users/mauraclark/AgentLevy/README.md)
- [demo/README.md](/Users/mauraclark/AgentLevy/demo/README.md)
- [demo/JOB_EXAMPLES.md](/Users/mauraclark/AgentLevy/demo/JOB_EXAMPLES.md)
- [openclaw/SKILL.md](/Users/mauraclark/AgentLevy/openclaw/SKILL.md)
- [docs/PRESENTATION_STYLE_GUIDE.md](/Users/mauraclark/AgentLevy/docs/PRESENTATION_STYLE_GUIDE.md)

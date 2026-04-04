# Deck Reconstruction Brief

This file reconstructs the lost presentation structure from the previous session so the team can rebuild slides consistently even if the original deck files are no longer available locally.

## Recommendation

For the current hackathon stage, rebuild the **Hackathon Deck** first.

Why:

- it is shorter
- it is sponsor-optimized
- it is easier to keep aligned with what is actually shipped today
- it maps cleanly to the current x402 happy-path demo

Rebuild the longer `Pitch Deck v5` only if there is time after the hackathon deck, website, and video are stable.

## Shared Theme

- background: `#070B18`
- cyan: `#00D4FF`
- green: `#00E5A0`
- orange: `#FF6B35`
- purple: `#7B61FF`
- headings: `Georgia`
- body text: `Calibri Light`

## Deck 1: Pitch Deck v5

This was the longer narrative deck with 11 slides.

### Slide 1

Title:

- `AgentLevy Protocol`

### Slide 2

Topic:

- the good-faith assumption in agent payments

### Slide 3

Topic:

- trust + levy infrastructure

### Slide 4

Topic:

- 6-step flow with spec commitment

### Slide 5

Topic:

- novelty table
- AgentLevy vs x402 vs Handshake58 vs ACP

### Slide 6

Topic:

- full architecture
- 6-step flow with technical labels

### Slide 7

Topic:

- why each stack choice was made

### Slide 8

Topic:

- six deliverables with file paths

### Slide 9

Topic:

- actual setup and commands

### Slide 10

Topic:

- shipped vs stubbed

### Slide 11

Topic:

- closing
- three key points
- GitHub link

## Deck 2: Hackathon Deck

This was the shorter 7-slide version and should be the primary rebuild target.

### Slide 1: Title

Use:

- `AgentLevy Protocol`
- subtitle around trust layer / atomic trust layer language

Recommended subtitle:

**The atomic trust layer for agent-to-agent commerce.**

### Slide 2: The Problem

Focus:

- current agent payment protocols still assume good faith after payment
- requesters and workers need pre-committed acceptance terms

### Slide 3: How It Works

Focus:

- spec commitment flow
- x402 request
- `402`
- `specHash`
- escrow
- submission
- verification
- settlement

### Slide 4: Novelty Table

This is the argument-winning slide.

Compare:

- AgentLevy
- x402
- Handshake58
- ACP

Rows should focus on:

- spec commitment
- verification before release
- escrow
- settlement proof
- audit trail

### Slide 5: What We Built

Show the actual deliverables that exist today.

Use repo-backed items like:

- Treasury contract
- facilitator
- task spec registry
- dashboard scaffold
- demo scripts
- agent skill

### Slide 6: Build Status

Be honest:

- what is live
- what is working end-to-end
- what is scaffolded
- what is future-facing

### Slide 7: Closing

Close on:

- spec on-chain
- TEE or deterministic verification path
- levy at attestation

Use a short final statement, not a dense paragraph.

## Current Rebuild Guidance

When rebuilding now, update the deck to reflect the current repo state:

- deployed treasury contract
- working end-to-end demo path
- FDC-aligned architecture
- dashboard scaffold
- x402 happy path as the primary demo
- Smart Accounts as secondary

## Messaging Guardrails

- use trust-layer language, not old layoffs/news framing
- avoid time-sensitive headlines
- keep the product concrete
- show success first and failure second
- make 0G visible as the agent layer
- make Flare visible as the trust and proof layer

## Best Current Headline Options

- `The atomic trust layer for agent-to-agent commerce`
- `The missing trust layer for the agentic economy`
- `Trust, escrow, verification, and proof for agent commerce`

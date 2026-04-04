# Demo Video Production Brief

This file complements [VIDEO_SCRIPT_3MIN.md](/Users/mauraclark/AgentLevy/demo/VIDEO_SCRIPT_3MIN.md) by listing the context, scenes, overlays, and visual rules needed to turn the script into a clean submission video.

## Goal

Produce a short video that shows:

- a real agent-to-agent workflow
- the x402 happy path
- committed task specs
- verification before release
- 0G as the agent layer
- Flare as the trust and proof layer

## Visual Style

Use the existing deck in [AgentLevy_Protocol_Hackathon_Deck.pptx](/Users/mauraclark/AgentLevy/documents/AgentLevy_Protocol_Hackathon_Deck.pptx) as the visual reference.

Reuse:

- dark background
- white + cyan title treatment
- robot iconography
- orange only for warning/failure moments

Do not reuse the deck's older token-tax storyline.

## Required Scenes

### Scene 1: Problem

Visuals:

- title card
- one simple x402 problem statement
- one comparison visual from [x402-comparison.svg](/Users/mauraclark/AgentLevy/demo/x402-comparison.svg)

Narrative:

- current payment requests still assume trust after payment

### Scene 2: Meet the agents

Visuals:

- `0G Publisher Agent`
- `0G Worker Agent`
- optional iNFT ownership badge on each card

Narrative:

- 0G powers the agents and agent identity

### Scene 3: Request and `402`

Visuals:

- job request
- `402 Payment Required`
- `taskId`
- `specHash`

Narrative:

- the committed spec is the acceptance contract

### Scene 4: Escrow on Flare

Visuals:

- payment action
- escrowed state
- tx hash or task state

Narrative:

- value is locked pending verification

### Scene 5: Worker output

Visuals:

- structured output
- a simple deterministic task example

Recommended examples:

- Solidity security triage
- structured data extraction

### Scene 6: Verification and proof

Visuals:

- verification checks
- pass result
- attestation or settlement record
- dashboard proof panel

Narrative:

- Flare is the trust layer

### Scene 7: Failure path

Visuals:

- malformed output
- verification failure
- no successful settlement

Narrative:

- failure proves the protocol matters

Keep this short.

### Scene 8: Closing frame

Visuals:

- AgentLevy wordmark
- protocol stack line
- skill download or website URL if available

Narrative:

- the atomic trust layer for agent-to-agent commerce

## Overlay Language

Prefer overlays like:

- `Committed Spec`
- `Escrow Locked`
- `Verification Passed`
- `Settlement Recorded`
- `Failure: No Successful Completion`

Avoid overlays like:

- `Worker Paid Instantly`

unless the video explicitly shows withdrawal.

## Assets To Reuse

- [AgentLevy_Protocol_Hackathon_Deck.pptx](/Users/mauraclark/AgentLevy/documents/AgentLevy_Protocol_Hackathon_Deck.pptx)
- [x402-comparison.svg](/Users/mauraclark/AgentLevy/demo/x402-comparison.svg)
- [JOB_EXAMPLES.md](/Users/mauraclark/AgentLevy/demo/JOB_EXAMPLES.md)
- [LIVE_DEMO_SCRIPT.md](/Users/mauraclark/AgentLevy/demo/LIVE_DEMO_SCRIPT.md)
- [VIDEO_SCRIPT_3MIN.md](/Users/mauraclark/AgentLevy/demo/VIDEO_SCRIPT_3MIN.md)

## Video Rules

- show success before failure
- keep Smart Accounts out of the main flow
- keep the video under 3 minutes
- make 0G visible, not just spoken
- make Flare visible, not just spoken
- keep the protocol concrete and operational

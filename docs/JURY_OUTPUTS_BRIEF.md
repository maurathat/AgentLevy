# Jury Outputs Brief

This file consolidates the three outputs we expect the jury to evaluate:

1. The root `README.md`
2. The recorded demo video
3. The public website and live demo surface

It also defines which materials in the repo are the current source of truth for content and which materials should be used only for visual direction.

## Current Positioning

The current AgentLevy story is:

**AgentLevy is the atomic trust layer for agent-to-agent commerce. 0G powers the agents. Flare powers the escrow, verification, and proof.**

This is the story that should drive the README, video, and website.

## Important Brand Note

The existing slide deck in [AgentLevy_Protocol_Hackathon_Deck.pptx](/Users/mauraclark/AgentLevy/documents/AgentLevy_Protocol_Hackathon_Deck.pptx) is useful as a **visual style reference**, but its narrative reflects an older AgentLevy thesis centered on token-consumption levy collection and workforce-retraining funding.

I only found one tracked presentation file in the repo, so until a newer deck is added, this file should be treated as the current visual reference and not as the current messaging source.

For the current hackathon project:

- reuse the deck's **visual language**
- do **not** reuse its older product narrative as the main story

The current technical and product source of truth is the repo itself:

- [README.md](/Users/mauraclark/AgentLevy/README.md)
- [demo/README.md](/Users/mauraclark/AgentLevy/demo/README.md)
- [demo/LIVE_DEMO_SCRIPT.md](/Users/mauraclark/AgentLevy/demo/LIVE_DEMO_SCRIPT.md)
- [demo/VIDEO_SCRIPT_3MIN.md](/Users/mauraclark/AgentLevy/demo/VIDEO_SCRIPT_3MIN.md)
- [demo/JOB_EXAMPLES.md](/Users/mauraclark/AgentLevy/demo/JOB_EXAMPLES.md)
- [openclaw/SKILL.md](/Users/mauraclark/AgentLevy/openclaw/SKILL.md)
- [sdk/taskSpecRegistry.js](/Users/mauraclark/AgentLevy/sdk/taskSpecRegistry.js)
- [sdk/x402Facilitator.js](/Users/mauraclark/AgentLevy/sdk/x402Facilitator.js)
- [contracts/Treasury.sol](/Users/mauraclark/AgentLevy/contracts/Treasury.sol)

Recovered deck structure and theme guidance live here:

- [DECK_RECONSTRUCTION_BRIEF.md](/Users/mauraclark/AgentLevy/docs/DECK_RECONSTRUCTION_BRIEF.md)
- [PRESENTATION_STYLE_GUIDE.md](/Users/mauraclark/AgentLevy/docs/PRESENTATION_STYLE_GUIDE.md)

## Output 1: Root README

### Job

The README has to do four things quickly:

- explain the problem
- explain the protocol flow
- explain why 0G and Flare matter
- make the repo runnable and credible

### What the jury should understand

- AgentLevy is not just another payment request flow
- it upgrades x402 with pre-committed acceptance criteria
- a worker only gets value after verification
- 0G is the agent infrastructure layer
- Flare is the trust, escrow, and proof layer

### What the README must show

- one-sentence positioning near the top
- x402 vs AgentLevy comparison
- end-to-end flow with `402`, `specHash`, escrow, submit, verify, settle
- short architecture section
- sponsor fit section covering 0G agents and iNFT identity
- sponsor fit section covering Flare verification, treasury, and proof
- clear local demo steps
- explicit note that Smart Accounts are supported but not the primary hackathon path

### What to avoid

- old token-tax / retraining-fund framing as the primary message
- long policy essays
- claiming universal verification for non-deterministic work
- saying the worker is instantly paid if the current flow only unlocks withdrawal

## Output 2: Demo Video

### Job

The video must communicate the whole product in under 3 minutes.

### Structure

Use:

1. problem
2. two agents
3. x402 request
4. committed spec
5. escrow on Flare
6. worker submission
7. verification and proof
8. short failure case
9. closing architecture line

### What the jury should remember

- the demo is agent-to-agent commerce, not just a dashboard
- the key primitive is payment release after verification
- 0G is visibly part of the workflow
- Flare is visibly part of the trust layer

### What the video should not do

- lead with Smart Accounts
- spend too much time on backend plumbing
- present failure before success
- drift back into the older slide-deck thesis

## Output 3: Website

### Job

The website should do two things at once:

- act as the public protocol page
- support the live hackathon demo

### Recommended shape

- `/` public protocol page
- `/demo` live demo console

### Public protocol page must include

- what AgentLevy is
- how the protocol works
- why x402 needs a trust layer
- where 0G fits
- where Flare fits
- a downloadable agent skill
- protocol addresses and endpoint references

### Demo page must include

- job list
- publisher and worker agents
- live protocol timeline
- proof drawer
- happy path and failure path controls

## Shared Messaging Pillars

All three outputs should repeat the same three claims:

1. **AgentLevy is the atomic trust layer for agent-to-agent commerce.**
2. **0G powers the agents and agent identity.**
3. **Flare powers the escrow, verification, and proof layer.**

## Shared Demo Boundaries

These constraints should remain consistent across README, video, and website:

- the main live path is the x402 happy path
- Smart Accounts are secondary
- iNFT is used for agent identity and ownership, not trial-to-own or agent purchase flow
- failure path is a second beat, not the main beat
- the protocol is for deterministic, machine-verifiable tasks

## Next File References

Use these companion files when producing the final materials:

- [PRESENTATION_STYLE_GUIDE.md](/Users/mauraclark/AgentLevy/docs/PRESENTATION_STYLE_GUIDE.md)
- [README_EDITORIAL_BRIEF.md](/Users/mauraclark/AgentLevy/demo/README_EDITORIAL_BRIEF.md)
- [VIDEO_PRODUCTION_BRIEF.md](/Users/mauraclark/AgentLevy/demo/VIDEO_PRODUCTION_BRIEF.md)
- [WEBSITE_CONTENT_BRIEF.md](/Users/mauraclark/AgentLevy/demo/WEBSITE_CONTENT_BRIEF.md)

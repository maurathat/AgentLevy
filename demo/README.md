# AgentLevy Demo Kit

This folder is the source of truth for how to present AgentLevy in the hackathon demo, live walkthrough, and recorded video.

## Demo strategy

The primary demo is the **x402 happy path**:

1. A **0G Publisher Agent** posts a job
2. AgentLevy returns **HTTP 402** with a committed `specHash`
3. Payment enters escrow on **Flare**
4. A **0G Worker Agent** completes the task
5. AgentLevy verifies the output against the committed spec
6. Settlement is recorded and the worker's withdrawal is unlocked
7. The dashboard shows the onchain proof and protocol levy record

The failure path is important, but it should be a **short second beat**, not the main act.

Why:

- the success path proves the protocol works
- the failure path proves why the protocol matters
- judges should first understand the product, then see the protection

## Recommended job type

Use **code review** as the main live job.

Why this is the strongest:

- every judge instantly understands the use case
- it is easy to explain what good vs bad output looks like
- deterministic verification is intuitive
- it fits both the 0G agent story and the Flare trust story

Use **data extraction** as the backup job if needed.

## Sponsor framing

### 0G

0G powers the agents:

- OpenClaw-style agents
- 0G Compute for agent execution
- 0G Storage for persistent memory or output references
- 0G agent workflow as the user-facing experience

### Flare

Flare powers the trust layer:

- committed task specs
- escrow
- attested verification
- proof and settlement record

Smart Accounts are optional and should be presented as an extension, not the main flow.

## Demo materials in this folder

- [README.md](/Users/mauraclark/AgentLevy/demo/README.md): high-level strategy
- [LIVE_DEMO_SCRIPT.md](/Users/mauraclark/AgentLevy/demo/LIVE_DEMO_SCRIPT.md): longer live walkthrough template
- [VIDEO_SCRIPT_3MIN.md](/Users/mauraclark/AgentLevy/demo/VIDEO_SCRIPT_3MIN.md): short submission video script
- [VIDEO_PRODUCTION_BRIEF.md](/Users/mauraclark/AgentLevy/demo/VIDEO_PRODUCTION_BRIEF.md): scene planning, overlays, and visual rules for editing the video
- [README_EDITORIAL_BRIEF.md](/Users/mauraclark/AgentLevy/demo/README_EDITORIAL_BRIEF.md): content brief for the root repo README
- [WEBSITE_CONTENT_BRIEF.md](/Users/mauraclark/AgentLevy/demo/WEBSITE_CONTENT_BRIEF.md): public site and live demo page content plan
- [HACKATHON_DECK.md](/Users/mauraclark/AgentLevy/demo/HACKATHON_DECK.md): rebuilt 7-slide deck source copy
- [TALK_TRACK_3MIN_SUMMARY.md](/Users/mauraclark/AgentLevy/demo/TALK_TRACK_3MIN_SUMMARY.md): concise narration summary for a 3-minute talk track
- [RUN_OF_SHOW.md](/Users/mauraclark/AgentLevy/demo/RUN_OF_SHOW.md): practical operator checklist
- [JOB_EXAMPLES.md](/Users/mauraclark/AgentLevy/demo/JOB_EXAMPLES.md): demo-safe example jobs for Publisher and Worker agents
- [x402-comparison.svg](/Users/mauraclark/AgentLevy/demo/x402-comparison.svg): protocol comparison visual
- [verifier-process.svg](/Users/mauraclark/AgentLevy/demo/verifier-process.svg): dark-theme verifier architecture visual

Supporting docs outside this folder:

- [JURY_OUTPUTS_BRIEF.md](/Users/mauraclark/AgentLevy/docs/JURY_OUTPUTS_BRIEF.md): maps the README, video, and website into one consistent submission strategy
- [PRESENTATION_STYLE_GUIDE.md](/Users/mauraclark/AgentLevy/docs/PRESENTATION_STYLE_GUIDE.md): visual reference derived from the existing slide deck
- [VERIFIER_MODES.md](/Users/mauraclark/AgentLevy/docs/VERIFIER_MODES.md): concise explainer for hackathon vs production verifier trust models
- [AGENTLEVY_LONGFORM.md](/Users/mauraclark/AgentLevy/docs/AGENTLEVY_LONGFORM.md): saved long-form description of what AgentLevy is and how it is made

## Run it yourself

```bash
# Terminal 1 — start the facilitator
node sdk/x402Facilitator.js

# Terminal 2 — run the x402 happy path
node sdk/agentWallet.js --demo

# Terminal 3 — watch the dashboard
cd dashboard && npm run dev
```

## Messaging constraint

Because the current contract uses a pull-withdrawal pattern, the demo language should say:

- "settlement is recorded"
- "worker withdrawal is unlocked"
- "levy is recorded onchain"

Avoid saying:

- "Worker Agent is instantly paid"

unless the demo explicitly includes the worker withdrawal step.

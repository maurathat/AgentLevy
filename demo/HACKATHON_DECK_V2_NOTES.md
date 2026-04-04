# AgentLevy Hackathon Deck V2 Notes

These are the improved speaker notes for the leaner pitch-deck version.

## Slide 1 — Problem + Solution

**Speaker goal:** land the problem immediately.

Suggested notes:

AgentLevy is the atomic trust and settlement layer for the agent economy. Today, agents can already pay each other, but that does not mean they can trust the outcome. If the work is incomplete, low quality, or not what was agreed, the money may already be gone. AgentLevy fixes that by turning payment into a safer flow: the job terms are locked, the funds are held, the result is checked, and payment is only released when the work actually meets the brief.

## Slide 2 — Protocol

**Speaker goal:** explain the primitive in one clean flow.

Suggested notes:

This slide shows the difference between standard x402 and AgentLevy. In standard x402, the client requests the API, the server returns 402, the client pays, the facilitator verifies the payment, the server does the work, and the response comes back. AgentLevy upgrades that sequence. The Publisher Agent requests the task and gets 402 plus the committed spec hash. The funds go into escrow on Flare. The Worker Agent does the work and submits the result. Then the output is verified against the committed spec, and only after that is settlement recorded on Flare. That is the message to land: request the task, hold funds in escrow, verify the result, and record settlement only after the work passes.

## Slide 3 — Agent Demo

**Speaker goal:** frame the live demo so judges know what matters.

Suggested notes:

Now we show the live demo. A 0G Publisher Agent hires a 0G Worker Agent through AgentLevy. What matters here is not the interface, but the trust trail: the request, the locked job terms, the escrow step, the result being checked, and the settlement being recorded. The point is simple: the worker does not get paid just because work was requested. Payment only moves when the job actually passes.

## Slide 4 — Summary

**Speaker goal:** close with credibility and sponsor fit.

Suggested notes:

What we built is real and working now: a treasury contract on Flare Coston2, an x402 facilitator, a task spec registry, a verifier flow, and a public skill so other agents can adopt the protocol. 0G powers the agents. Flare powers the escrow, settlement, and proof path. Next, we are packaging this into a public protocol page and a cleaner demo console, while pushing toward even stronger verification. The closing message is that AgentLevy makes agent work dependable enough to transact with confidence.

# AgentLevy 3-Minute Video Script V2

## Slide 1 — What AgentLevy Is

AgentLevy is the atomic trust and settlement layer for the agent economy.

Today,with x402, Handshake and ACP agents can already pay each other, but payment alone does not create trust. In the current paradigm, If the work provided by the worker agent is incomplete or not what was agreed, the money is already paid to the worker and validation of their work is left to a 3rd party to resolve after the payment has been delivered, this process relies on evaluation of the task cafter payment has been delivered.

AgentLevy fixes this by upgrading x402 from a payment request into a trustworthy work transaction.

## Slide 2 — How It Works

Here is the flow in plain language.

In standard x402, the client requests the API, the server returns 402, the client pays, the facilitator verifies the payment, the server does the work, and the response is returned.

AgentLevy upgrades that flow. The Publisher Agent requests the task and gets 402 plus the committed spec hash. The funds are held in escrow on Flare. The Worker Agent does the work and submits the result. Then the result is verified against the committed spec, and only after that is settlement recorded on Flare.

That is the key shift: request the task, hold funds in escrow, verify the result, and record settlement only after the work passes.

## Slide 3 — Live Demo

Now we show the live path.

A 0G Publisher Agent hires a 0G Worker Agent through AgentLevy.
What matters in the demo is the trust trail:
the request,
the locked job terms,
the escrow step,
the result being checked,
and the settlement being recorded.

The point is simple: the worker does not get paid just because work was requested. Payment only moves when the job actually passes.

## Slide 4 — What We Built

What we built is real and working now:
a treasury contract on Flare Coston2,
an x402 facilitator,
a task spec registry,
a verifier flow,
and a public skill so other agents can adopt the protocol.

0G powers the agents.
Flare powers the escrow, settlement, and proof path.

Next, we are packaging this into a public protocol page and a cleaner demo console, while pushing toward even stronger verification.

AgentLevy makes agent work dependable enough to transact with confidence.

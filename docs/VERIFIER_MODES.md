# Verifier Modes

This file explains the difference between the hackathon verifier and the production verifier.

## One Sentence

The verifier is the same **protocol role** in both versions. The difference is how strongly its execution is proven.

## What stays the same

In both the hackathon and production architectures:

- the task spec is committed before work starts
- the worker output is checked against that committed spec
- the verifier produces a pass/fail result
- the treasury enforces the result

So the protocol shape is the same.

## Hackathon: deterministic protocol verifier

### What it is

A deterministic verifier implemented in the protocol app layer.

### Where it runs

- facilitator / verifier service
- standard server runtime

### What it does

- loads the committed task spec
- validates output structure
- runs deterministic checks
- computes pass/fail and score
- returns a verification result that the protocol can use for settlement

### Trust model

For the hackathon, users are trusting:

- the open protocol logic
- the committed spec
- the deterministic nature of the checks
- the operator running that verifier honestly

### Why it is valid for the demo

It proves the most important product claim:

**payment release depends on machine-verifiable completion, not good faith.**

## Production: attested protocol verifier in confidential compute / TEE-backed infrastructure

### What it is

The same verifier role, but executed inside confidential compute or a Trusted Execution Environment.

### Where it runs

- confidential compute
- TEE-backed runtime
- attested execution environment

### What it does

- loads the same committed task spec or manifest
- runs the same deterministic verification logic
- produces a signed or attested result
- ties that result to the code hash and runtime identity

### Trust model

In production, users are trusting:

- the committed spec
- the verifier runtime
- the hardware-backed attestation that proves the verifier code ran as expected

They are no longer relying mainly on the honesty of the server operator.

## The practical difference

### Hackathon

- proves protocol logic
- proves UX and flow
- proves deterministic acceptance criteria
- does not yet provide the strongest possible execution proof

### Production

- proves protocol logic
- proves deterministic acceptance criteria
- adds strong evidence that the verifier execution itself was not tampered with

## Best way to explain it publicly

Use this wording:

**Hackathon:** deterministic protocol verifier  
**Production:** attested protocol verifier running in confidential compute / TEE-backed infrastructure

And this clarifying line:

**The protocol does not change. The trust guarantee around execution gets stronger.**

## Related asset

- [verifier-process.svg](/Users/mauraclark/AgentLevy/demo/verifier-process.svg)

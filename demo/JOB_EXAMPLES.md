# AgentLevy Demo Job Examples

These example jobs are for the hackathon demo and presentation materials.

They are not meant to define the full long-term product scope. They are meant to help explain how AgentLevy works when a **Publisher Agent** posts work and a **Worker Agent** completes work under a committed, machine-verifiable specification.

## How to use these examples

Use one example as the main happy path and keep the second one as backup.

Recommended:

- main example: `Solidity security triage`
- backup example: `Structured data extraction`

## Example 1 — Solidity Security Triage

### Why this works for the demo

- feels high value
- relevant to blockchain judges
- maps cleanly to the existing `code-review` service
- verification can be explained as schema + rule consistency, not subjective judgment

### Publisher Agent job brief

**Job type:** `code-review`

**Prompt:**

"Review this Solidity contract and return a structured list of potential security issues. Each finding must include the file, line number, severity, short message, and rule identifier."

### What the Worker Agent returns

The Worker Agent returns structured findings like:

```json
{
  "issues": [
    {
      "file": "contracts/Treasury.sol",
      "line": 305,
      "severity": "medium",
      "message": "Dispute refund window is anchored to escrow creation instead of dispute creation.",
      "rule": "dispute-window-anchor"
    },
    {
      "file": "contracts/Treasury.sol",
      "line": 335,
      "severity": "high",
      "message": "Dispute resolution only refunds the Publisher Agent, allowing unilateral payout veto.",
      "rule": "dispute-resolution-bias"
    }
  ],
  "summary": {
    "totalIssues": 2,
    "bySeverity": {
      "high": 1,
      "medium": 1
    }
  }
}
```

### Why it is deterministic enough for AgentLevy

The protocol is not proving that the Worker Agent performed a perfect human audit.

The protocol is proving that the Worker Agent returned:

- the committed output shape
- valid severity values
- valid line references
- valid rule identifiers
- a summary consistent with the finding list

That is enough to demonstrate:

- committed task specification
- structured output
- deterministic verification
- release of value only after the agreed format is satisfied

### Failure example

This should fail:

```json
{
  "issues": [
    {
      "file": "contracts/Treasury.sol",
      "line": "around the refund logic",
      "severity": "urgent",
      "message": "This looks bad",
      "rule": ""
    }
  ],
  "summary": {
    "totalIssues": 1,
    "bySeverity": {
      "urgent": 1
    }
  }
}
```

Why it fails:

- line is not numeric
- severity is outside the allowed enum
- rule identifier is missing

## Example 2 — Structured Data Extraction

### Why this works for the demo

- easier for non-technical judges to understand
- very clean agent marketplace example
- deterministic output is obvious

### Publisher Agent job brief

**Job type:** `data-extraction`

**Prompt:**

"Extract structured startup information from these company blurbs. Return one object per company with company name, category, geography, and stage."

### What the Worker Agent returns

```json
{
  "results": [
    {
      "id": "company-1",
      "extracted": {
        "company": "Example Labs",
        "category": "AI infrastructure",
        "geography": "Europe",
        "stage": "Seed"
      },
      "confidence": 0.91
    },
    {
      "id": "company-2",
      "extracted": {
        "company": "Ledger Flow",
        "category": "Fintech",
        "geography": "US",
        "stage": "Series A"
      },
      "confidence": 0.88
    }
  ]
}
```

### Why it is deterministic enough for AgentLevy

The protocol verifies:

- output exists
- schema shape is respected
- completion rate is met
- confidence values are in range

This is a very clean demonstration of:

- publish work
- consume work
- verify output structure
- settle only after acceptance conditions are met

### Failure example

This should fail:

```json
{
  "results": [
    {
      "id": "company-1",
      "extracted": "AI company in Europe",
      "confidence": "high"
    }
  ]
}
```

Why it fails:

- extracted payload is not structured correctly
- confidence is not numeric

## Recommended demo usage

### Main demo

Use `Solidity security triage` if:

- the audience is technical
- you want higher perceived value
- you want a more sponsor-aligned blockchain example

### Backup demo

Use `Structured data extraction` if:

- you want the easiest explanation
- you need a safer non-technical fallback
- you want to emphasize agent marketplace behavior over security analysis

## Recommended presenter language

Say:

"These example jobs are intentionally structured so the completion criteria can be committed in advance and verified objectively."

"The protocol is not trying to prove open-ended subjective quality. It is proving that the worker satisfied the agreed machine-checkable contract for the task."

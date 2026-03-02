[README.md](https://github.com/user-attachments/files/25695821/README.md)
# AgentLevy Protocol

> **A token-consumption withholding mechanism for the agentic economy.**

---

## The Problem

Governments fund social safety nets through income tax. AI agents are replacing the human workers who paid that tax — at scale, and accelerating. Block Inc. cut 4,000 jobs in February 2026. Klarna replaced 700 customer service workers. Salesforce let go of 4,000 support staff. Jack Dorsey's assessment: most companies will reach the same conclusion within a year.

Agents pay $0 in tax. The income tax base is collapsing in real time.

The political response — wealth taxes on accumulated assets — is blunt, capital-flight-inducing, and misses the point entirely. The problem isn't that some people have too much. The problem is that the mechanism connecting economic activity to public revenue is broken.

AgentLevy fixes the mechanism.

---

## The Insight

The IRS didn't solve income tax compliance by chasing millions of individual workers. It made employers withhold at source.

AgentLevy applies the same logic to the agentic economy.

**Tax at the token. Not the agent.**

Token consumption at enterprise API scale is the proxy for economic activity that previously generated income tax revenue. A company burning millions of tokens a month on autonomous agents is generating real economic value — value that a human workforce previously created, and paid taxes on.

Rather than classifying agents, tracking workflows, or building complex identity registries, AgentLevy collects a micro-levy at the AI provider billing layer — the same way a gas tax is collected at the refinery, invisible at the pump.

---

## How It Works

```
Enterprise uses AI provider API
        ↓
Billing cycle closes (monthly / quarterly)
        ↓
AgentLevy SDK calculates levy on enterprise token consumption
        ↓
Flare Data Connector verifies and attests the billing event on-chain
        ↓
Single settlement transaction to Flare treasury contract
        ↓
Taxai dashboard shows enterprise their contribution + compliance proof
        ↓
XRP Ledger disburses periodically to verified retraining funds
```

No workflow classification. No agent registration. No real-time streaming. No complex cross-chain bridges. One billing event. One settlement. One treasury. Like every tax system ever built.

---

## The Protocol Stack

| Layer | Component | Role |
|-------|-----------|------|
| **Collection** | AgentLevy SDK | Embedded in AI provider billing. Calculates levy on enterprise token consumption at billing cycle close. |
| **Verification** | Flare Data Connector + FTSO | Verifies billing events from provider APIs on-chain. Native enshrined oracle — no third party. |
| **Treasury** | Flare Smart Contract | Receives levy per billing cycle. Immutable audit trail. Single settlement transaction. |
| **Settlement** | XRP Ledger | Periodic institutional disbursements to government retraining funds via existing Flare ↔ XRPL bridge. |

---

## Why Flare

Flare is the only blockchain with a native, enshrined oracle designed specifically to verify real-world data on-chain without a third-party dependency. This matters for AgentLevy because the core attestation problem — verifying that a billing event from OpenAI or Anthropic is accurate — requires exactly what Flare Data Connector was built to do.

- **Flare Data Connector** — pulls verifiable data from external APIs and web2 sources directly onto Flare, no middleware
- **FTSO** — native decentralized price oracle for USD denomination of levy amounts
- **Flare AI Kit** — open-source SDK for building verifiable AI agent applications on Flare; handles provider attestation layer
- **EVM Compatible** — Solidity smart contracts, composable with existing DeFi infrastructure
- **XRPL Bridge** — existing live bridge between Flare and XRP Ledger for institutional settlement

---

## Why Provider-Level Collection

An enterprise deploying AI agents on AWS Bedrock, OpenAI, or Anthropic is already a known entity with completed KYC, an active billing relationship, and metered usage data. The provider already knows exactly how many tokens each enterprise account consumed. The infrastructure for collection already exists — AgentLevy adds a levy calculation to a billing event that is already happening.

This approach:

- **Eliminates the classification problem** — no need to determine whether an agent is "replacing" a human workflow; token consumption at enterprise scale is the unit of measurement
- **Eliminates the registration problem** — enterprises don't register agents; they're already in the provider's billing system
- **Eliminates the enforcement problem** — ~15 AI providers cover ~90% of global enterprise agentic activity; integration at that layer covers the market
- **Mirrors proven tax collection precedents** — payroll withholding, gas tax, streaming royalties all collect upstream from a small number of aggregators rather than chasing millions of end participants

---

## Governance

AgentLevy separates three distinct governance concerns, each with appropriate mechanisms:

### Rate Setting — Multi-Stakeholder Council
An 11-seat council with representation from AI providers (3 seats), enterprise operators (3 seats), worker advocacy organizations (2 seats), independent economists (2 seats), and a non-voting government observer (1 seat). Rate changes require an 8/11 supermajority and a mandatory 180-day notice period before taking effect. No surprise rate changes. Enterprises can plan around it.

### Fund Disbursement — On-Chain Grants Process
Treasury disbursements are public on-chain proposals visible for 30 days before execution. Any council member can veto within that window. Recipient organizations must be KYC-verified retraining programs. Fully auditable — no black box.

### Protocol Parameters — Timelocked Multisig
Thresholds, enterprise tier definitions, and provider qualification criteria are set at launch and can only be modified through a 7-of-10 multisig held by geographically distributed technical stewards. Separates technical governance from political governance entirely.

### On Legitimacy
AgentLevy does not claim democratic legitimacy. Neither does SWIFT, VISA's interchange structure, or the Basel banking accords in their early years. These are technical standards that *enable* legitimate regulatory oversight rather than replacing it.

The EU mandated participation in existing private carbon credit registries rather than building their own. That is the template. AgentLevy is designed so that when governments are ready to legislate, the infrastructure already exists, the audit trail is already there, and compliance is already happening.

---

## Taxai

Taxai is the enterprise-facing compliance dashboard built on top of AgentLevy Protocol. It gives CFOs and compliance teams:

- Real-time view of token consumption across all AI provider accounts
- Levy calculation and contribution history
- Exportable audit trail for ESG reporting and regulatory compliance
- Proof of contribution to verified retraining programs

Taxai is to AgentLevy what a tax portal is to a tax authority — the human-readable interface to an automated underlying system.

---

## Roadmap

### Phase 1 — Protocol + Voluntary (2026)
- ETHGlobal Cannes hackathon — proof of concept on Flare testnet
- Open-source protocol and SDK
- Enterprise early adopters with strong ESG commitments
- Taxai compliance dashboard MVP
- Establish voluntary market, carbon credit precedent model

### Phase 2 — Enterprise Scale (2026–2027)
- Provider SDK integrations (targeting 3–5 major providers)
- Retraining fund treasury live on Flare mainnet
- Enterprise onboarding — companies facing regulatory and PR pressure
- Council governance formation
- XRP settlement to first verified retraining programs

### Phase 3 — Legislative Foundation (2027+)
- Government API layer for jurisdiction-specific compliance reporting
- Protocol positioned as the compliance rail for incoming AI labor legislation
- Voluntary market transitions to mandatory participation in adopting jurisdictions
- Multi-jurisdictional treasury contracts

---

## Hackathon Scope — ETHGlobal Cannes, April 2026

The v0 hackathon build demonstrates the core primitive works end-to-end:

- [ ] Mock AI provider API emitting a billing event with enterprise token consumption data
- [ ] AgentLevy SDK calculating levy amount from billing event
- [ ] Flare Data Connector integration verifying and attesting the billing event on-chain
- [ ] Flare treasury smart contract receiving the levy settlement
- [ ] Taxai dashboard displaying enterprise contribution in real time
- [ ] XRP settlement transaction to a mock retraining fund wallet

One provider. One enterprise account. One billing cycle. One settlement. Complete proof of concept.

---

## The Case for Providers

AI providers are the largest regulatory target in technology history. Every government is attempting to regulate AI. A provider that walks into Brussels, Washington, or Westminster with a built-in displacement levy — auditable, transparent, on-chain — has an extraordinary regulatory shield.

The first provider to implement AgentLevy doesn't just do good. They set the standard every other provider must meet. That is a competitive advantage in a world where regulatory risk is existential.

---

## Status

🟡 **Pre-launch — protocol architecture complete, seeking technical co-builder**

Architecture, governance model, and go-to-market strategy are complete. Hackathon deck is ready. Seeking a Solidity / Flare developer to co-build the v0 proof of concept for ETHGlobal Cannes, April 2026.

If you have experience with Flare Data Connector, Flare AI Kit, or EVM smart contracts and want to build infrastructure that matters, get in touch.

---

## License

Protocol design and documentation: MIT

SDK and smart contracts: to be determined at mainnet launch

---

*AgentLevy Protocol — because agents replacing humans should fund the transition.*

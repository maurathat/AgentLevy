---
eip: <TBD>
title: Verified Task Escrow and Attestation Interface
description: Standard interface for escrowed task payments using committed task specs and verifier attestations.
author: Maura Clark (@maurathat), AgentLevy contributors
discussions-to: <TBD>
status: Draft
type: Standards Track
category: ERC
created: 2026-04-04
requires: 165
---

# Verified Task Escrow and Attestation Interface

## Simple Summary

A standard contract interface for escrowed task payments where settlement depends on verifier attestations against a committed task specification hash.

## Abstract

This ERC defines a standard interface for task-based escrow contracts in which a requester escrows funds for a worker, commits to a task specification hash at escrow time, and releases settlement only after a verifier submits an attestation against that committed specification. The standard is designed for agent-to-agent commerce, machine-verifiable work, API-driven service marketplaces, and any workflow where payment should depend on deterministic task completion rather than a simple request-response exchange.

The standard introduces:

- task escrow with immutable `taskSpecHash` commitment
- verifier-submitted attestations referencing the committed spec
- settlement and refund state transitions
- standardized events for indexing, proof, and analytics
- optional extensions for spec registration, verifier registration, dispute handling, and timeout refunds

This draft does not standardize the offchain transport protocol, task manifest format, or verifier implementation details. It standardizes the onchain settlement interface and event model that lets requesters, workers, facilitators, verifiers, wallets, and dashboards interoperate.

## Motivation

Current payment request systems can standardize charging for access or service invocation, but they do not standardize what happens when payment should depend on delivery quality. In agent-to-agent commerce, data extraction, code review, task execution, or other structured work may require a pre-committed acceptance contract so that:

- the requester cannot change the goalposts after payment is locked
- the worker knows the exact acceptance conditions before starting
- payment is not treated as final merely because a request was made
- third parties can independently verify what was agreed and how settlement happened

Without a standard settlement interface, every protocol defines its own escrow model, verifier relationship, payout path, and event schema. That fragmentation makes it harder for wallets, dashboards, agent frameworks, marketplaces, and verifiers to integrate across systems.

This ERC defines a reusable settlement primitive for "verified work before release" flows.

## Specification

### Definitions

- **requester**: the party escrowing funds for a task. In AgentLevy terminology, the Publisher Agent.
- **worker**: the intended recipient if the task passes verification. In AgentLevy terminology, the Worker Agent.
- **verifier**: an authorized account or attested execution environment that submits the verification result.
- **task spec hash**: a content hash committing to the task specification, acceptance criteria, or verification manifest.
- **attestation hash**: a hash or identifier representing the verifier result, proof artifact, or attestation payload.
- **output hash**: a hash of the worker output or submitted artifact.

### State Machine

An implementation MUST expose a task state model semantically equivalent to:

```solidity
enum TaskStatus {
    NonExistent,
    Escrowed,
    Verified,
    Settled,
    Disputed,
    Refunded
}
```

Implementations MAY use different internal names or values, but MUST preserve the semantic meaning of:

- no task exists
- funds are escrowed and awaiting attestation
- an attestation has been submitted
- settlement is finalized in favor of the worker
- the task is disputed
- settlement is finalized in favor of refund

### Required Interface

Contracts implementing this ERC SHOULD implement ERC-165 and expose the following interface:

```solidity
interface IERC_VTEAI {
    event TaskEscrowed(
        bytes32 indexed taskId,
        address indexed requester,
        address indexed worker,
        uint256 totalAmount,
        uint256 workerAmount,
        uint256 protocolAmount,
        bytes32 taskSpecHash,
        string serviceId
    );

    event AttestationSubmitted(
        bytes32 indexed taskId,
        address indexed verifier,
        bool passed,
        bytes32 outputHash,
        bytes32 attestationHash,
        string score
    );

    event TaskSettled(
        bytes32 indexed taskId,
        address indexed requester,
        address indexed worker,
        uint256 workerAmount,
        uint256 protocolAmount,
        string serviceId,
        bytes32 attestationHash,
        uint256 timestamp
    );

    event TaskRefunded(bytes32 indexed taskId, address indexed requester, uint256 amount);
    event WithdrawalQueued(address indexed recipient, uint256 amount);
    event WithdrawalClaimed(address indexed recipient, uint256 amount);

    function escrowPayment(
        bytes32 taskId,
        address worker,
        bytes32 taskSpecHash,
        string calldata serviceId
    ) external payable;

    function submitAttestation(
        bytes32 taskId,
        bytes32 attestationHash,
        bytes32 outputHash,
        bool passed,
        string calldata score
    ) external;

    function withdraw() external;

    function getEscrow(bytes32 taskId) external view returns (
        address requester,
        address worker,
        uint256 totalAmount,
        uint256 workerAmount,
        uint256 protocolAmount,
        bytes32 taskSpecHash,
        string memory serviceId,
        uint8 status,
        uint256 escrowedAt,
        uint256 settledAt,
        bytes32 attestationHash
    );
}
```

### Escrow Requirements

When `escrowPayment` is called:

- `taskId` MUST uniquely identify the task
- `worker` MUST identify the intended worker recipient
- `taskSpecHash` MUST commit to the agreed task specification or verification manifest
- `serviceId` SHOULD identify the task class, service name, or marketplace route
- the implementation MUST store the escrow record and transition the task to an escrowed state
- the implementation MUST emit `TaskEscrowed`

If the implementation splits funds between worker payout and a protocol amount, levy, fee, or treasury amount, it MUST make that split observable either through the event fields or the escrow view.

### Attestation Requirements

When `submitAttestation` is called:

- the task MUST already exist in escrow
- the verifier MUST be authorized according to the implementation's verifier model
- the attestation MUST be bound to the `taskId`
- the attestation MUST reference the committed `taskSpecHash` implicitly or explicitly through the stored escrow record
- `outputHash` SHOULD identify the output artifact, result payload, or deliverable hash
- `passed` MUST determine whether the task becomes eligible for settlement or refund
- the implementation MUST emit `AttestationSubmitted`

### Settlement Requirements

If `passed == true`:

- the implementation MUST transition the task to a settled state, either directly or through an intermediate verified state
- the worker amount MUST become withdrawable by the worker or be transferred to the worker
- any protocol amount MUST be retained or routed according to the implementation
- the implementation MUST emit `TaskSettled`

If `passed == false`:

- the implementation MUST NOT emit `TaskSettled`
- the implementation MUST make a refund path available to the requester, either immediately or through a timeout/dispute path

### Withdrawal Requirements

If the implementation uses queued withdrawals:

- `withdraw` MUST transfer the queued amount to `msg.sender`
- the implementation MUST zero or deduct the withdrawable balance before external value transfer
- the implementation MUST emit `WithdrawalClaimed`

### Optional Extensions

Implementations MAY provide:

- spec registration and service mapping
- verifier registration and revocation
- dispute initiation
- timeout refunds
- owner or governance-based dispute resolution
- richer attestation records
- task history indexing helpers

Optional extension events MAY include:

- `SpecRegistered`
- `VerifierRegistered`
- `VerifierRevoked`
- `TaskDisputed`
- `OwnershipTransferred`

## Offchain Components

This ERC intentionally does not standardize:

- task transport over HTTP or x402
- offchain task manifest schema
- output storage location
- whether the verifier is centralized, decentralized, attested, or TEE-backed

However, interoperable implementations SHOULD ensure that:

- the committed `taskSpecHash` can be resolved to a machine-readable task definition by offchain participants
- the verifier result can be linked to an output artifact or output hash
- the meaning of `serviceId` and `score` is documented

## Rationale

### Why standardize the onchain layer instead of the full protocol?

The offchain transport layer may vary across ecosystems. Some implementations may use x402, some may use marketplace relayers, some may use intent protocols, and some may use direct peer messaging. Standardizing the onchain escrow and attestation interface gives wallets, dashboards, indexers, and agent frameworks a stable interoperability target without forcing one transport layer.

### Why use a task spec hash instead of storing the full spec onchain?

Task specifications and verification manifests may be large, versioned, or stored in content-addressed systems. A hash commitment preserves immutability while allowing offchain systems to resolve the full definition.

### Why permit either push settlement or queued withdrawal?

Different implementations may prefer direct transfer or pull-based withdrawals. The standard therefore focuses on the settlement outcome rather than enforcing a single payout delivery model.

### Why not standardize TEE or attestation format directly?

Verifier trust models will evolve. Some deployments may use a deterministic server verifier, while others may use TEE-backed confidential compute, decentralized verifiers, or attestation frameworks such as FDC. This ERC standardizes the settlement interface and leaves the verifier trust model to implementation-specific documentation.

## Backwards Compatibility

This ERC is complementary to request protocols such as x402 and does not replace them. Existing payment-request systems can adopt this ERC as their settlement and verification layer by:

- committing a task spec hash at payment time
- escrowing funds into a compliant contract
- submitting attestation results through the standard verifier method

This ERC also composes with existing task marketplaces and agent frameworks by providing a standard "verified work before release" settlement contract.

## Security Considerations

Implementers should consider at minimum:

- **Verifier trust assumptions**: a naive server verifier introduces operator trust. TEE-backed or attested verifier infrastructure provides stronger guarantees.
- **Spec availability**: if `taskSpecHash` cannot be resolved to the actual task definition, interoperability and dispute handling degrade.
- **Replay and duplication**: `taskId` uniqueness and attestation replay protections are essential.
- **Settlement safety**: queued withdrawals are safer than direct push transfers when workers may be smart contracts.
- **Refund semantics**: failed, timed-out, or disputed tasks must have a real refund path or funds may be locked.
- **Dispute abuse**: dispute state transitions should not give either party a trivial unilateral veto over fair settlement.
- **State exhaustion**: history arrays should be indexer-friendly, and implementations should prefer events over onchain iteration where possible.
- **Value accounting**: if protocol fees, levies, or treasury amounts are separated from worker payout, balances and event semantics must remain unambiguous.

## Reference Implementation

AgentLevy Protocol is a reference implementation of this draft.

Relevant files:

- [Treasury.sol](/Users/mauraclark/AgentLevy/contracts/Treasury.sol)
- [x402Facilitator.js](/Users/mauraclark/AgentLevy/sdk/x402Facilitator.js)
- [taskSpecRegistry.js](/Users/mauraclark/AgentLevy/sdk/taskSpecRegistry.js)

In AgentLevy:

- the product or protocol name is **AgentLevy Protocol**
- the proposed neutral standards-track name is **Verified Task Escrow and Attestation Interface**

## Protocol Name

Recommended naming split:

- **Protocol / product name**: AgentLevy Protocol
- **ERC draft name**: Verified Task Escrow and Attestation Interface

This allows the branded implementation and the neutral standard to coexist cleanly.

## Copyright Waiver

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

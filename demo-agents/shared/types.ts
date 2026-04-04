// ─── Verification ────────────────────────────────────────────────────────────

export type VerificationType =
  | "json_schema"    // validate JSON output against a schema
  | "test_suite"     // run test cases, all must pass
  | "checksum_match" // SHA256 of output matches expected
  | "ftso_price_bound" // values within Flare FTSO price range

export interface VerificationSpec {
  type: VerificationType
  // The actual criteria — shape depends on type:
  // json_schema    → { schema: JSONSchema, additional_checks?: [...] }
  // test_suite     → { test_file: string, framework: "pytest" | "jest" | "forge" }
  // checksum_match → { algorithm: "sha256", expected: string }
  // ftso_price_bound → { ftso_contract: string, tolerance_bps: number }
  criteria: Record<string, unknown>
}

// ─── Task Spec ───────────────────────────────────────────────────────────────

export interface TaskSpec {
  id: string                  // unique task ID (uuid)
  description: string         // human-readable description of what Agent B must do
  verification: VerificationSpec
  payment: {
    amount: string            // e.g. "0.05"
    token: "USDC"             // token used for payment
    timeoutSeconds: number    // deadline for Agent B to deliver
  }
  postedAt: number            // unix timestamp (ms)
  posterAddress: string       // Agent A's wallet address
}

// ─── Proof Payload ───────────────────────────────────────────────────────────

export interface ProofPayload {
  taskId: string              // must match TaskSpec.id
  executorAddress: string     // Agent B's wallet address
  resultHash: string          // keccak256 hash of the result data
  resultStorageURI: string    // where to fetch the result: e.g. "swarm://..." or "ipfs://..."
  attestation?: string        // TEE attestation bytes (hex) — optional in Phase 1
  submittedAt: number         // unix timestamp (ms)
}

// ─── Task States ─────────────────────────────────────────────────────────────

export type TaskState =
  | "POSTED"           // Agent A posted, waiting for Agent B to claim
  | "CLAIMED"          // Agent B claimed, agreement locked on-chain
  | "DELIVERED"        // Agent B submitted resultHash
  | "VERIFIED"         // Verifier contract confirmed pass/fail
  | "SETTLED"          // Treasury released payment
  | "REFUNDED"         // Timeout or verification failed, Agent A refunded
  | "EXPIRED"          // Deadline passed with no delivery

// ─── On-chain Events ─────────────────────────────────────────────────────────

export interface TaskPostedEvent {
  taskId: string
  poster: string
  specHash: string        // keccak256 of the serialised TaskSpec
  amount: bigint
  deadline: bigint        // block timestamp
}

export interface TaskClaimedEvent {
  taskId: string
  executor: string        // Agent B's address
  deadline: bigint
}

export interface TaskSettledEvent {
  taskId: string
  recipient: string       // seller (pass) or buyer (fail/timeout)
  amount: bigint
  passed: boolean
}

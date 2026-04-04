// ─── Contract Addresses (Flare Coston2 Testnet) ───────────────────────────────
// TODO: fill these in after deploying contracts

export const CONTRACT_ADDRESSES = {
  taskRegistry: (process.env.TASK_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  verifier:     (process.env.VERIFIER_ADDRESS      ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  treasury:     (process.env.TREASURY_ADDRESS      ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  usdt0:        (process.env.USDT0_ADDRESS           ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
}

// ─── TaskRegistry ABI ─────────────────────────────────────────────────────────
// Functions: postTask, claimTask, getTask, getTaskState
// Events:    TaskPosted, TaskClaimed, TaskSettled

export const TASK_REGISTRY_ABI = [
  // postTask(specHash, amount, token, timeoutSeconds) → taskId
  {
    name: "postTask",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "specHash",       type: "bytes32" },
      { name: "amount",         type: "uint256" },
      { name: "token",          type: "address" },
      { name: "timeoutSeconds", type: "uint256" },
    ],
    outputs: [{ name: "taskId", type: "bytes32" }],
  },
  // claimTask(taskId) — Agent B locks agreement
  {
    name: "claimTask",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "bytes32" }],
    outputs: [],
  },
  // getTaskState(taskId) → uint8 (maps to TaskState enum)
  {
    name: "getTaskState",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "taskId", type: "bytes32" }],
    outputs: [{ name: "state", type: "uint8" }],
  },
  // Events
  {
    name: "TaskPosted",
    type: "event",
    inputs: [
      { name: "taskId",   type: "bytes32", indexed: true },
      { name: "poster",   type: "address", indexed: true },
      { name: "specHash", type: "bytes32", indexed: false },
      { name: "amount",   type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
  {
    name: "TaskClaimed",
    type: "event",
    inputs: [
      { name: "taskId",   type: "bytes32", indexed: true },
      { name: "executor", type: "address", indexed: true },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
  {
    name: "TaskSettled",
    type: "event",
    inputs: [
      { name: "taskId",    type: "bytes32", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount",    type: "uint256", indexed: false },
      { name: "passed",    type: "bool",    indexed: false },
    ],
  },
] as const

// ─── Verifier ABI ─────────────────────────────────────────────────────────────
// Functions: submitProof, getVerificationResult

export const VERIFIER_ABI = [
  // submitProof(taskId, resultHash, attestation)
  {
    name: "submitProof",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "taskId",      type: "bytes32" },
      { name: "resultHash",  type: "bytes32" },
      { name: "attestation", type: "bytes"   },
    ],
    outputs: [{ name: "passed", type: "bool" }],
  },
  // getVerificationResult(taskId) → (verified, passed)
  {
    name: "getVerificationResult",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "taskId", type: "bytes32" }],
    outputs: [
      { name: "verified", type: "bool" },
      { name: "passed",   type: "bool" },
    ],
  },
] as const

// ─── ERC20 ABI (minimal — approve + balanceOf) ───────────────────────────────

export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",     type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const

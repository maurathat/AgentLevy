export type PaymentMode = "dry-run" | "live";

export interface NetworkSnapshot {
  name: string;
  chainId: number;
  rpcUrl: string;
  currency: string;
  explorerUrl: string;
}

export interface AgentSnapshot {
  name: string;
  role: string;
  keychainService: string;
  configured: boolean;
  address: string | null;
  expectedAddress: string | null;
  addressMatchesExpected: boolean | null;
  balance0g: string | null;
  balanceWei: string | null;
}

export interface InferenceSnapshot {
  agentName: string;
  configured: boolean;
  mode: "0g-direct-proxy";
  serviceUrl: string | null;
  model: string | null;
  lastPrompt: string | null;
  lastResponse: string | null;
  lastError: string | null;
}

export interface DeterministicArtifact {
  sourceText: string;
  normalizedText: string;
  wordCount: number;
  sha256: string;
}

export interface JobProof {
  signer: string;
  statement: string;
  artifactHash: string;
  signature: string;
}

export interface PaymentSnapshot {
  mode: PaymentMode;
  rewardWei: string;
  reward0g: string;
  executed: boolean;
  txHash: string | null;
}

export interface JobSnapshot {
  id: string;
  status: "idle" | "published" | "claimed" | "completed" | "paid" | "failed";
  description: string;
  deterministicCriteria: string[];
  rewardWei: string;
  reward0g: string;
  sourceText: string;
  executionReport: string | null;
  artifact: DeterministicArtifact | null;
  proof: JobProof | null;
  validatorResult: string | null;
  payment: PaymentSnapshot | null;
}

export interface DashboardSnapshot {
  network: NetworkSnapshot;
  agents: AgentSnapshot[];
  inference: InferenceSnapshot;
  inferenceByAgent: InferenceSnapshot[];
  latestJob: JobSnapshot | null;
  logs: string[];
}

export interface InferenceRequest {
  prompt?: string;
}

export interface MarketplaceRunRequest {
  sourceText?: string;
}

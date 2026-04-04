import "dotenv/config";

import { createHash } from "crypto";
import { randomBytes } from "node:crypto";
import { formatEther, JsonRpcProvider, verifyMessage, Wallet } from "ethers";

import { getJsonRpcProvider, CHAIN_CONFIG } from "../services/0g.js";
import { getKeychainSecret, hasKeychainSecret, setKeychainSecret } from "../services/keychain.js";
import type {
  AgentSnapshot,
  DashboardSnapshot,
  DeterministicArtifact,
  InferenceSnapshot,
  JobProof,
  JobSnapshot,
  MarketplaceRunRequest,
  PaymentMode,
  PaymentSnapshot,
} from "../shared/demo.js";

const DEFAULT_PROMPT =
  "You are Steve_ZC running on the 0G inference layer. In two short sentences, introduce yourself and explain how Steve_ZC and Woz_ZC will collaborate in a deterministic marketplace demo.";
const DEFAULT_SOURCE_TEXT =
  "ETHGlobal Cannes demo task: normalize this sentence, count the words, and prove the result deterministically.";
const LOG_LIMIT = 120;

interface KeychainAgentConfig {
  name: string;
  role: string;
  keychainService: string;
  expectedAddress: string | null;
}

interface InternalAgent {
  config: KeychainAgentConfig;
  wallet: Wallet | null;
  snapshot: AgentSnapshot;
}

interface InferenceResult {
  prompt: string;
  text: string;
}

function env(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

function normalizeServiceUrl(serviceUrl: string): string {
  const trimmed = serviceUrl.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/v1/proxy")) {
    return trimmed;
  }
  return `${trimmed}/v1/proxy`;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalArtifact(artifact: DeterministicArtifact): string {
  return JSON.stringify({
    sourceText: artifact.sourceText,
    normalizedText: artifact.normalizedText,
    wordCount: artifact.wordCount,
    sha256: artifact.sha256,
  });
}

function normalizeText(sourceText: string): string {
  return sourceText.trim().toLowerCase().replace(/\s+/g, " ");
}

function createArtifact(sourceText: string): DeterministicArtifact {
  const normalizedText = normalizeText(sourceText);
  return {
    sourceText,
    normalizedText,
    wordCount: normalizedText.length === 0 ? 0 : normalizedText.split(" ").length,
    sha256: sha256Hex(normalizedText),
  };
}

function format0G(wei: bigint): string {
  return Number.parseFloat(formatEther(wei)).toFixed(4);
}

function rewardWei(): bigint {
  const raw = env("ZEROCLAW_MARKETPLACE_REWARD_WEI", "1000000000000000");
  try {
    return BigInt(raw);
  } catch {
    return BigInt("1000000000000000");
  }
}

function paymentMode(): PaymentMode {
  return env("ZEROCLAW_PAYMENT_MODE", "dry-run") === "live" ? "live" : "dry-run";
}

function makeJobId(sourceText: string): string {
  const seed = `${Date.now()}:${sourceText}:${randomBytes(6).toString("hex")}`;
  return `job-${sha256Hex(seed).slice(0, 12)}`;
}

function createAgentConfig(name: string, role: string, keySuffix: string, expectedAddress = ""): KeychainAgentConfig {
  return {
    name,
    role,
    keychainService: env(`ZEROCLAW_${keySuffix}_KEYCHAIN_SERVICE`, `${name}_PRIVATE_KEY`),
    expectedAddress: env(`ZEROCLAW_${keySuffix}_EXPECTED_ADDRESS`, expectedAddress) || null,
  };
}

export class ZeroClawDemoService {
  private readonly provider: JsonRpcProvider;
  private readonly steveConfig = createAgentConfig(
    "Steve_ZC",
    "publisher",
    "STEVE_ZC",
    "0x5b340a8553d08B65Cebf303514B0415E3aD1E8f7",
  );
  private readonly wozConfig = createAgentConfig("Woz_ZC", "worker", "WOZ_ZC");
  private readonly inferenceUrl = env("ZEROCLAW_INFERENCE_URL");
  private readonly inferenceModel = env("ZEROCLAW_INFERENCE_MODEL");
  private readonly inferenceApiKey = env("ZEROCLAW_INFERENCE_API_KEY");
  private readonly logs: string[] = [];
  private latestJob: JobSnapshot | null = null;
  private latestInference: InferenceSnapshot = {
    configured: false,
    mode: "0g-direct-proxy",
    serviceUrl: null,
    model: null,
    lastPrompt: null,
    lastResponse: null,
    lastError: null,
  };

  constructor() {
    this.provider = getJsonRpcProvider();
    this.addLog(`0G demo service ready on ${CHAIN_CONFIG.name}.`);
  }

  private addLog(message: string): void {
    const entry = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.logs.push(entry);
    if (this.logs.length > LOG_LIMIT) {
      this.logs.shift();
    }
  }

  private loadAgent(config: KeychainAgentConfig): InternalAgent {
    if (!hasKeychainSecret(config.keychainService)) {
      return {
        config,
        wallet: null,
        snapshot: {
          name: config.name,
          role: config.role,
          keychainService: config.keychainService,
          configured: false,
          address: null,
          expectedAddress: config.expectedAddress,
          addressMatchesExpected: null,
          balance0g: null,
          balanceWei: null,
        },
      };
    }

    const privateKey = getKeychainSecret(config.keychainService);
    const wallet = new Wallet(privateKey, this.provider);
    const expectedAddress = config.expectedAddress;
    const addressMatchesExpected = expectedAddress
      ? wallet.address.toLowerCase() === expectedAddress.toLowerCase()
      : null;

    return {
      config,
      wallet,
      snapshot: {
        name: config.name,
        role: config.role,
        keychainService: config.keychainService,
        configured: true,
        address: wallet.address,
        expectedAddress,
        addressMatchesExpected,
        balance0g: null,
        balanceWei: null,
      },
    };
  }

  private async withBalances(agents: InternalAgent[]): Promise<AgentSnapshot[]> {
    return Promise.all(
      agents.map(async (agent) => {
        if (!agent.wallet) {
          return agent.snapshot;
        }

        try {
          const balanceWei = await this.provider.getBalance(agent.wallet.address);
          return {
            ...agent.snapshot,
            balanceWei: balanceWei.toString(),
            balance0g: Number.parseFloat(formatEther(balanceWei)).toFixed(4),
          };
        } catch (error) {
          this.addLog(`Balance lookup failed for ${agent.config.name}: ${String(error)}`);
          return agent.snapshot;
        }
      }),
    );
  }

  private async ensureWozWallet(): Promise<InternalAgent> {
    const existing = this.loadAgent(this.wozConfig);
    if (existing.wallet) {
      return existing;
    }

    const wallet = Wallet.createRandom();
    setKeychainSecret(this.wozConfig.keychainService, wallet.privateKey);
    this.addLog(`Generated ${this.wozConfig.name} and stored its private key in macOS Keychain.`);
    return this.loadAgent(this.wozConfig);
  }

  private async runInference(prompt = DEFAULT_PROMPT): Promise<InferenceResult> {
    const configured = Boolean(this.inferenceUrl && this.inferenceModel && this.inferenceApiKey);
    const serviceUrl = configured ? normalizeServiceUrl(this.inferenceUrl) : null;
    this.latestInference = {
      configured,
      mode: "0g-direct-proxy",
      serviceUrl,
      model: this.inferenceModel || null,
      lastPrompt: prompt,
      lastResponse: null,
      lastError: null,
    };

    if (!configured || !serviceUrl) {
      const error =
        "0G inference is not configured. Set ZEROCLAW_INFERENCE_URL, ZEROCLAW_INFERENCE_MODEL, and ZEROCLAW_INFERENCE_API_KEY.";
      this.latestInference.lastError = error;
      this.addLog(error);
      throw new Error(error);
    }

    this.addLog(`Steve_ZC is calling the 0G inference proxy for model ${this.inferenceModel}.`);
    const response = await fetch(`${serviceUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.inferenceApiKey}`,
      },
      body: JSON.stringify({
        model: this.inferenceModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are Steve_ZC, a precise autonomous agent on 0G. Keep outputs concise and demo-friendly.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      const error = `0G inference failed with ${response.status}: ${detail}`;
      this.latestInference.lastError = error;
      this.addLog(error);
      throw new Error(error);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    this.latestInference.lastResponse = text;
    this.addLog("0G inference response received successfully.");
    return { prompt, text };
  }

  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    const steve = this.loadAgent(this.steveConfig);
    const woz = this.loadAgent(this.wozConfig);
    const agents = await this.withBalances([steve, woz]);

    return {
      network: CHAIN_CONFIG,
      agents,
      inference: this.latestInference,
      latestJob: this.latestJob,
      logs: [...this.logs].reverse(),
    };
  }

  async triggerInference(prompt?: string): Promise<DashboardSnapshot> {
    await this.runInference(prompt || DEFAULT_PROMPT);
    return this.getDashboardSnapshot();
  }

  async runMarketplaceDemo(request?: MarketplaceRunRequest): Promise<DashboardSnapshot> {
    const steve = this.loadAgent(this.steveConfig);
    if (!steve.wallet) {
      const error = `Steve_ZC is not configured. Import the private key into Keychain service ${this.steveConfig.keychainService}.`;
      this.addLog(error);
      throw new Error(error);
    }

    if (
      steve.snapshot.expectedAddress &&
      steve.snapshot.addressMatchesExpected === false
    ) {
      const error = "Steve_ZC keychain private key does not match the expected public address.";
      this.addLog(error);
      throw new Error(error);
    }

    const woz = await this.ensureWozWallet();
    if (!woz.wallet) {
      throw new Error("Woz_ZC wallet initialization failed.");
    }

    const sourceText = request?.sourceText?.trim() || DEFAULT_SOURCE_TEXT;
    const jobId = makeJobId(sourceText);
    const reward = rewardWei();

    this.latestJob = {
      id: jobId,
      status: "published",
      description:
        "Normalize the source text, count words after normalization, and provide a signed proof bundle.",
      deterministicCriteria: [
        "normalizedText must equal trim(lowercase(collapse-spaces(sourceText)))",
        "wordCount must equal the number of space-separated words in normalizedText",
        "sha256 must equal SHA-256(normalizedText)",
        "Woz_ZC must sign the exact job statement plus artifact hash",
      ],
      rewardWei: reward.toString(),
      reward0g: format0G(reward),
      sourceText,
      executionReport: null,
      artifact: null,
      proof: null,
      validatorResult: null,
      payment: null,
    };

    this.addLog(`Steve_ZC published ${jobId} with reward ${format0G(reward)} 0G.`);

    let executionReport: string | null = null;
    try {
      const inference = await this.runInference(
        `You are Woz_ZC. In one sentence, explain how you will solve this deterministic job: "${sourceText}"`,
      );
      executionReport = inference.text;
    } catch (error) {
      executionReport = `Inference unavailable: ${error instanceof Error ? error.message : String(error)}`;
    }

    this.latestJob.status = "claimed";
    this.latestJob.executionReport = executionReport;
    this.addLog("Woz_ZC claimed the job and prepared a deterministic execution report.");

    const artifact = createArtifact(sourceText);
    const artifactHash = sha256Hex(canonicalArtifact(artifact));
    const statement = `ZeroClaw job ${jobId} artifact ${artifactHash}`;
    const signature = await woz.wallet.signMessage(statement);
    const proof: JobProof = {
      signer: woz.wallet.address,
      statement,
      artifactHash,
      signature,
    };

    this.latestJob.status = "completed";
    this.latestJob.artifact = artifact;
    this.latestJob.proof = proof;
    this.addLog("Woz_ZC completed the deterministic artifact and signed the proof bundle.");

    const recovered = verifyMessage(statement, signature);
    const expectedArtifact = createArtifact(sourceText);
    const expectedArtifactHash = sha256Hex(canonicalArtifact(expectedArtifact));
    const proofValid =
      recovered.toLowerCase() === woz.wallet.address.toLowerCase() &&
      expectedArtifactHash === artifactHash;

    if (!proofValid) {
      this.latestJob.status = "failed";
      this.latestJob.validatorResult = "Steve_ZC rejected the proof because validation failed.";
      this.addLog("Steve_ZC rejected the proof bundle.");
      return this.getDashboardSnapshot();
    }

    this.latestJob.validatorResult =
      "Steve_ZC verified the signature, normalized artifact, and SHA-256 digest successfully.";
    this.addLog("Steve_ZC verified the deterministic proof bundle.");

    const payment: PaymentSnapshot = {
      mode: paymentMode(),
      rewardWei: reward.toString(),
      reward0g: format0G(reward),
      executed: false,
      txHash: null,
    };

    if (payment.mode === "live") {
      const tx = await steve.wallet.sendTransaction({
        to: woz.wallet.address,
        value: reward,
      });
      payment.executed = true;
      payment.txHash = tx.hash;
      this.latestJob.status = "paid";
      this.addLog(`Steve_ZC sent the reward on-chain. Tx hash: ${tx.hash}`);
    } else {
      this.latestJob.status = "paid";
      this.addLog("Payment mode is dry-run, so the reward transfer was simulated but not broadcast.");
    }

    this.latestJob.payment = payment;
    return this.getDashboardSnapshot();
  }
}

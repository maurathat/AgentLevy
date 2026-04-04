/**
 * FDC Web2Json attestation flow for verifying AgentLevy task attestations on Coston2.
 *
 * Flow: prepareRequest → submitAttestation → waitForRoundFinalization → fetchProof → verify
 *
 * The attestation endpoint is GET /status/:taskId on the facilitator.
 */

import { ethers } from "ethers";
import "dotenv/config";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const COSTON2_RPC = "https://coston2-api.flare.network/ext/C/rpc";
const VERIFIER_BASE =
  process.env.VERIFIER_URL_TESTNET ??
  "https://fdc-verifier-testnet.flare.network";
const VERIFIER_API_KEY =
  process.env.VERIFIER_API_KEY_TESTNET ??
  "00000000-0000-0000-0000-000000000000";
const DA_LAYER_BASE =
  process.env.COSTON2_DA_LAYER_URL ??
  "https://fdc-da-layer-testnet.flare.network";
const FACILITATOR_BASE =
  process.env.FACILITATOR_URL ?? "https://facilitator.agentlevy.xyz";

// Flare periphery artifact for Web2Json verification
import IFdcVerificationArtifact from "@flarenetwork/flare-periphery-contract-artifacts/artifacts/coston2/IFdcVerification.json" assert { type: "json" };
import ContractRegistryArtifact from "@flarenetwork/flare-periphery-contract-artifacts/artifacts/coston2/ContractRegistry.json" assert { type: "json" };
import IRelayArtifact from "@flarenetwork/flare-periphery-contract-artifacts/artifacts/coston2/IRelay.json" assert { type: "json" };
import IFdcHubArtifact from "@flarenetwork/flare-periphery-contract-artifacts/artifacts/coston2/IFdcHub.json" assert { type: "json" };
import IFlareSystemsManagerArtifact from "@flarenetwork/flare-periphery-contract-artifacts/artifacts/coston2/IFlareSystemsManager.json" assert { type: "json" };
import IWeb2JsonVerificationArtifact from "@flarenetwork/flare-periphery-contract-artifacts/artifacts/coston2/IWeb2JsonVerification.json" assert { type: "json" };

// ContractRegistry address on Coston2 (fixed)
const CONTRACT_REGISTRY_ADDR = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

// FDC protocol ID for Relay finalization checks
const FDC_PROTOCOL_ID = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProvider() {
  return new ethers.JsonRpcProvider(COSTON2_RPC);
}

function getSigner() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set in environment");
  return new ethers.Wallet(pk, getProvider());
}

async function getContractRegistry(signerOrProvider) {
  return new ethers.Contract(
    CONTRACT_REGISTRY_ADDR,
    ContractRegistryArtifact.abi,
    signerOrProvider
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Prepare attestation request via the verifier
// ---------------------------------------------------------------------------

/**
 * Build and prepare a Web2Json attestation request for a task status check.
 *
 * @param {string} taskId - The AgentLevy task ID to verify.
 * @returns {Promise<string>} abiEncodedRequest ready for FdcHub.
 */
export async function prepareRequest(taskId) {
  // The ABI signature describes the struct that the response will be encoded
  // into.  Fields must match what the facilitator endpoint returns after jq
  // post-processing.
  const abiSignature =
    '(bool taskExists, string taskId, string status, uint256 completedAt)';

  const body = {
    attestationType: "0x5765623248736f6e000000000000000000000000000000000000000000000000", // "Web2Json" padded to bytes32
    sourceId: "0x5075626c69635765623200000000000000000000000000000000000000000000", // "PublicWeb2" padded to bytes32
    requestBody: {
      url: `${FACILITATOR_BASE}/status/${taskId}`,
      httpMethod: "GET",
      headers: "",
      queryParams: "",
      body: "",
      postProcessJq:
        '{taskExists: .taskExists, taskId: .taskId, status: .status, completedAt: .completedAt}',
      abiSignature,
    },
  };

  const res = await fetch(
    `${VERIFIER_BASE}/verifier/web2/Web2Json/prepareRequest`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-apikey": VERIFIER_API_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Verifier prepareRequest failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const abiEncodedRequest = json.abiEncodedRequest;
  if (!abiEncodedRequest) {
    throw new Error(
      "Verifier did not return abiEncodedRequest: " + JSON.stringify(json)
    );
  }
  console.log("Prepared abiEncodedRequest:", abiEncodedRequest.slice(0, 40) + "...");
  return abiEncodedRequest;
}

// ---------------------------------------------------------------------------
// Step 2 — Submit attestation request to FdcHub
// ---------------------------------------------------------------------------

/**
 * Submit the encoded attestation request on-chain.
 *
 * @param {string} abiEncodedRequest
 * @returns {Promise<{roundId: number, txHash: string}>}
 */
export async function submitAttestation(abiEncodedRequest) {
  const signer = getSigner();
  const registry = await getContractRegistry(signer);

  // Resolve FdcHub address
  const fdcHubAddr = await registry.getContractAddressByName("FdcHub");
  const fdcHub = new ethers.Contract(fdcHubAddr, IFdcHubArtifact.abi, signer);

  // Get request fee
  const fee = await fdcHub.getRequestFee();

  // Submit
  const tx = await fdcHub.requestAttestation(abiEncodedRequest, {
    value: fee,
  });
  console.log("Submitted attestation tx:", tx.hash);
  const receipt = await tx.wait();

  // Compute voting round ID from block timestamp
  const block = await signer.provider.getBlock(receipt.blockNumber);
  const blockTimestamp = block.timestamp;

  // Get voting epoch params from FlareSystemsManager
  const fsmAddr = await registry.getContractAddressByName(
    "FlareSystemsManager"
  );
  const fsm = new ethers.Contract(
    fsmAddr,
    IFlareSystemsManagerArtifact.abi,
    signer.provider
  );
  const firstRoundStart = Number(
    await fsm.firstVotingRoundStartTs()
  );
  const epochDuration = Number(
    await fsm.votingEpochDurationSeconds()
  );

  const roundId = Math.floor(
    (Number(blockTimestamp) - firstRoundStart) / epochDuration
  );
  console.log("Voting round ID:", roundId);

  return { roundId, txHash: tx.hash };
}

// ---------------------------------------------------------------------------
// Step 3 — Wait for round finalization
// ---------------------------------------------------------------------------

/**
 * Poll the Relay contract until the round is finalized.
 *
 * @param {number} roundId
 * @param {number} [timeoutMs=300000] — max wait in ms (default 5 min)
 * @param {number} [pollMs=10000] — poll interval in ms (default 10s)
 */
export async function waitForFinalization(
  roundId,
  timeoutMs = 300_000,
  pollMs = 10_000
) {
  const provider = getProvider();
  const registry = await getContractRegistry(provider);
  const relayAddr = await registry.getContractAddressByName("Relay");
  const relay = new ethers.Contract(relayAddr, IRelayArtifact.abi, provider);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const finalized = await relay.isFinalized(FDC_PROTOCOL_ID, roundId);
    if (finalized) {
      console.log(`Round ${roundId} finalized.`);
      return;
    }
    console.log(`Round ${roundId} not yet finalized, waiting ${pollMs / 1000}s...`);
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error(`Round ${roundId} not finalized within ${timeoutMs / 1000}s`);
}

// ---------------------------------------------------------------------------
// Step 4 — Fetch proof from DA Layer
// ---------------------------------------------------------------------------

/**
 * Retrieve the Merkle proof and response data from the DA Layer.
 *
 * @param {number} roundId
 * @param {string} abiEncodedRequest — the same bytes submitted on-chain
 * @returns {Promise<{merkleProof: string[], response_hex: string}>}
 */
export async function fetchProof(roundId, abiEncodedRequest) {
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 10_000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(
      `${DA_LAYER_BASE}/api/v1/fdc/proof-by-request-round-raw`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          votingRoundId: roundId,
          requestBytes: abiEncodedRequest,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      if (attempt < MAX_RETRIES) {
        console.log(
          `DA Layer attempt ${attempt} failed (${res.status}), retrying in ${RETRY_DELAY_MS / 1000}s...`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw new Error(`DA Layer proof request failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    if (!json.proof || !json.response_hex) {
      if (attempt < MAX_RETRIES) {
        console.log(
          `DA Layer attempt ${attempt}: incomplete response, retrying...`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw new Error("DA Layer did not return proof/response_hex: " + JSON.stringify(json));
    }

    console.log("Proof retrieved from DA Layer.");
    return { merkleProof: json.proof, response_hex: json.response_hex };
  }
}

// ---------------------------------------------------------------------------
// Step 5 — Decode response and verify on-chain
// ---------------------------------------------------------------------------

/**
 * Decode the DA Layer response and verify the Web2Json proof on-chain via
 * IFdcVerification / IWeb2JsonVerification.
 *
 * @param {{merkleProof: string[], response_hex: string}} proofData
 * @returns {Promise<{verified: boolean, taskId: string, status: string, completedAt: number}>}
 */
export async function verifyProof(proofData) {
  const { merkleProof, response_hex } = proofData;
  const provider = getProvider();

  // Decode the response using the Web2Json verification artifact's ABI
  const iface = new ethers.Interface(IWeb2JsonVerificationArtifact.abi);
  // The response type definition from the artifact — find the verify function input
  const verifyFn = iface.getFunction("verifyWeb2Json");
  const proofType = verifyFn.inputs[0]; // the Proof struct

  // Decode the response_hex into the Proof.data (Response) struct
  const responseType = IWeb2JsonVerificationArtifact._json?.abi?.[0]?.inputs?.[0]?.components?.[1];
  let decodedResponse;
  if (responseType) {
    decodedResponse = ethers.AbiCoder.defaultAbiCoder().decode(
      [ethers.ParamType.from(responseType)],
      response_hex
    )[0];
  } else {
    // Fallback: decode with IFdcVerification
    decodedResponse = ethers.AbiCoder.defaultAbiCoder().decode(
      ["tuple(bytes32 attestationType, bytes32 sourceId, uint64 votingRound, uint64 lowestUsedTimestamp, tuple(bytes32 urlHash, bytes32 postProcessJqHash, tuple(bytes abi_encoded_data) responseBody) responseBody)"],
      response_hex
    )[0];
  }

  // Build the proof struct for the verification call
  const proof = {
    merkleProof,
    data: decodedResponse,
  };

  // Get FdcVerification contract
  const registry = await getContractRegistry(provider);
  const fdcVerAddr = await registry.getContractAddressByName("FdcVerification");
  const fdcVerification = new ethers.Contract(
    fdcVerAddr,
    IFdcVerificationArtifact.abi,
    provider
  );

  // Verify — static call (read-only) to check validity
  const verified = await fdcVerification.verifyWeb2Json(proof);
  console.log("On-chain verification result:", verified);

  // Decode the task attestation data from abi_encoded_data
  let taskData = null;
  if (verified) {
    const abiEncodedData =
      decodedResponse.responseBody?.responseBody?.abi_encoded_data ??
      decodedResponse[4]?.[2]?.[0]; // fallback tuple indexing

    if (abiEncodedData) {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["bool", "string", "string", "uint256"],
        abiEncodedData
      );
      taskData = {
        taskExists: decoded[0],
        taskId: decoded[1],
        status: decoded[2],
        completedAt: Number(decoded[3]),
      };
      console.log("Decoded task attestation:", taskData);
    }
  }

  return { verified, ...taskData };
}

// ---------------------------------------------------------------------------
// Full flow: end-to-end attestation verification for a task
// ---------------------------------------------------------------------------

/**
 * Run the complete FDC Web2Json attestation flow for a given task.
 *
 * @param {string} taskId
 * @returns {Promise<{verified: boolean, taskId: string, status: string, completedAt: number}>}
 */
export async function verifyTask(taskId) {
  console.log(`\n=== FDC Web2Json attestation for task: ${taskId} ===\n`);

  // 1. Prepare
  const abiEncodedRequest = await prepareRequest(taskId);

  // 2. Submit to FdcHub
  const { roundId } = await submitAttestation(abiEncodedRequest);

  // 3. Wait for round finalization
  await waitForFinalization(roundId);

  // 4. Fetch proof from DA Layer
  const proofData = await fetchProof(roundId, abiEncodedRequest);

  // 5. Verify on-chain
  const result = await verifyProof(proofData);

  console.log("\n=== Attestation result ===");
  console.log(result);
  return result;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const taskId = process.argv[2];
if (taskId) {
  verifyTask(taskId).catch((err) => {
    console.error("Attestation flow failed:", err);
    process.exit(1);
  });
}

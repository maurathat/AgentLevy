/**
 * AgentLevy — x402 Facilitator
 *
 * This is the AgentLevy x402 facilitator. It sits between Agent A and Agent B.
 * When Agent A requests a task and gets HTTP 402, it pays through this facilitator.
 * The facilitator escrows payment in the Flare Treasury contract and routes the levy.
 *
 * The spec hash is committed at escrow time — neither party can change it.
 * TEE verifies output against the committed spec before releasing funds.
 *
 * Payment paths:
 *   1. Flare-native: Agent A calls POST /pay with C2FLR directly
 *   2. XRPL Smart Account: Agent A sends XRPL Payment with encoded memo,
 *      operator relays via MasterAccountController → Treasury.escrowPayment()
 *
 * Hackathon scope:
 *   - 5 service types with deterministic verification
 *   - Spec hash committed on-chain at escrow
 *   - XRPL Smart Account support (Custom Instruction 0xff)
 *   - TEE verification (simplified — Flare AI Kit upgrade on April 3rd)
 *   - confirmAndSettle via Treasury.sol
 *   - Levy routes at attestation (architectural, not enforced)
 */

import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { createHash, randomUUID } from 'crypto';
import * as xrpl from 'xrpl';
import {
  getSpec,
  hashSpec,
  calculatePrice,
  listServices,
  verifyAgainstSpec,
} from './taskSpecRegistry.js';

dotenv.config();

const app = express();
app.use(express.json());

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const COSTON2_RPC   = process.env.COSTON2_RPC || 'https://coston2-api.flare.network/ext/C/rpc';
const TREASURY_ADDR = process.env.TREASURY_ADDRESS || '';
const PRIVATE_KEY   = process.env.PRIVATE_KEY || '';

// Smart Accounts — MasterAccountController on Coston2
const MASTER_ACCOUNT_CONTROLLER_ADDR =
  process.env.MASTER_ACCOUNT_CONTROLLER_ADDRESS || '';
// Operator XRPL address that receives instruction payments
const OPERATOR_XRPL_ADDRESS = process.env.OPERATOR_XRPL_ADDRESS || '';
// XRPL connection
const XRPL_WSS = process.env.XRPL_WSS || 'wss://s.altnet.rippletest.net:51233';

// Minimal ABI for what the facilitator needs
const TREASURY_ABI = [
  'function escrowPayment(bytes32 taskId, address agentB, bytes32 taskSpecHash, string serviceId) payable',
  'function submitAttestation(bytes32 taskId, bytes32 attestationHash, bytes32 outputHash, bool passed, string score)',
  'function getEscrow(bytes32 taskId) view returns (tuple(address agentA, address agentB, uint256 totalAmount, uint256 levyAmount, uint256 taskFee, bytes32 taskSpecHash, string serviceId, uint8 status, uint256 escrowedAt, uint256 settledAt, bytes32 attestationHash))',
  'event LevySettled(bytes32 indexed taskId, address indexed agentA, address indexed agentB, uint256 taskFee, uint256 levyAmount, string serviceId, bytes32 attestationHash, uint256 timestamp)',
];

// MasterAccountController ABI — functions needed for Smart Account flows
const MASTER_ACCOUNT_CONTROLLER_ABI = [
  'function registerCustomInstruction(tuple(address targetContract, uint256 value, bytes data)[] calls)',
  'function encodeCustomInstruction(tuple(address targetContract, uint256 value, bytes data)[] calls) view returns (bytes32)',
  'function executeTransaction(tuple(bytes32[] merkleProof, tuple(bytes32 attestationType, bytes32 sourceId, uint64 votingRound, uint64 lowestUsedTimestamp, tuple(uint64 blockNumber, uint64 blockTimestamp, bytes32 sourceAddressHash, bytes32 receivingAddressHash, bytes32 intendedReceivingAddressHash, uint256 spentAmount, uint256 intendedSpentAmount, uint256 receivingAmount, uint256 intendedReceivingAmount, bytes32 standardPaymentReference, bool oneToOne, uint8 status) responseBody) data) proof, string xrplAddress)',
  'function getPersonalAccount(string xrplAddress) view returns (address)',
  'function getXrplProviderWallets() view returns (string[])',
];

const provider = new ethers.JsonRpcProvider(COSTON2_RPC);
const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
const treasury = new ethers.Contract(TREASURY_ADDR, TREASURY_ABI, signer);

// MasterAccountController (operator is the signer / relayer)
const masterController = MASTER_ACCOUNT_CONTROLLER_ADDR
  ? new ethers.Contract(MASTER_ACCOUNT_CONTROLLER_ADDR, MASTER_ACCOUNT_CONTROLLER_ABI, signer)
  : null;

// In-memory task store (use DB in production)
const tasks = new Map();

// Pending XRPL payment references awaiting relay → Flare execution
const pendingXrplPayments = new Map();

// ─── ROUTES ──────────────────────────────────────────────────────────────────

/**
 * GET /services
 * List all available service types with specs and pricing.
 * Agents discover what services are available and at what price.
 */
app.get('/services', (req, res) => {
  res.json({
    services:   listServices(),
    levyBps:    50,
    levyNote:   'Levy is included in totalDue. Routes at attestation confirmation.',
  });
});

/**
 * GET /task/:serviceId
 * x402 — Agent A requests a service.
 * Returns HTTP 402 with payment instructions and COMMITTED spec hash.
 *
 * Key: the specHash in this response is what gets committed on-chain.
 * Agent A is agreeing to evaluate Agent B against this exact spec.
 */
app.get('/task/:serviceId', (req, res) => {
  const { serviceId } = req.params;
  const inputItems = parseInt(req.query.items || '1');
  const spec = getSpec(serviceId);

  if (!spec) {
    return res.status(404).json({ error: `Unknown service: ${serviceId}` });
  }

  const taskId   = randomUUID();
  const price    = calculatePrice(serviceId, inputItems);
  const specHash = hashSpec(serviceId);

  // Return 402 Payment Required with payment instructions
  res.status(402).json({
    protocol:       'x402',
    version:        '1.0',
    taskId,
    serviceId,
    specHash,
    spec,
    pricing: {
      totalDue:     price,
      currency:     'RLUSD',
      levyIncluded: Math.floor((price * 50) / 10000),
      levyBps:      50,
    },
    payment: {
      // Option 1: Direct Flare payment (C2FLR)
      flare: {
        treasury:     TREASURY_ADDR,
        network:      'flare-coston2',
        method:       'escrowPayment',
        params:       { taskId, specHash, serviceId },
      },
      // Option 2: XRPL Smart Account — pay from XRPL wallet, no FLR needed
      xrpl: {
        endpoint:     '/pay/xrpl',
        description:  'Send XRPL Payment with encoded memo. Smart Account triggers Treasury escrow on Flare automatically.',
        operatorAddress: OPERATOR_XRPL_ADDRESS || null,
        params:       { taskId, serviceId },
      },
    },
    commitment:     'specHash is immutable after escrow. TEE verifies output against this hash.',
  });
});

/**
 * POST /pay
 * Agent A confirms payment. Facilitator escrows in Treasury.sol.
 */
app.post('/pay', async (req, res) => {
  const { taskId, serviceId, agentB, inputItems } = req.body;

  if (!taskId || !serviceId || !agentB) {
    return res.status(400).json({ error: 'Missing required fields: taskId, serviceId, agentB' });
  }

  const spec = getSpec(serviceId);
  if (!spec) return res.status(404).json({ error: `Unknown service: ${serviceId}` });

  const price    = calculatePrice(serviceId, inputItems || 1);
  const specHash = hashSpec(serviceId);
  const taskIdHash = ethers.keccak256(ethers.toUtf8Bytes(taskId));

  try {
    // Escrow payment in Treasury.sol
    const tx = await treasury.escrowPayment(
      taskIdHash,
      agentB,
      specHash,
      serviceId,
      { value: ethers.parseEther(price.toString()) }
    );
    await tx.wait();

    // Track task locally
    tasks.set(taskId, {
      taskIdHash,
      serviceId,
      specHash,
      agentB,
      price,
      status:    'escrowed',
      startTime: Date.now(),
      txHash:    tx.hash,
    });

    res.json({
      status:   'escrowed',
      taskId,
      taskIdHash,
      txHash:   tx.hash,
      specHash,
      message:  'Payment escrowed. Agent B can now start the task.',
    });

  } catch (err) {
    console.error('[Pay] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── XRPL SMART ACCOUNT ROUTES ──────────────────────────────────────────────

/**
 * POST /pay/xrpl
 * Agent A pays from an XRPL wallet via Flare Smart Accounts.
 *
 * Flow:
 *   1. Facilitator builds a CustomCall targeting Treasury.escrowPayment()
 *   2. Registers the custom instruction with MasterAccountController
 *   3. Returns the 32-byte payment reference for Agent A's XRPL Payment memo
 *   4. Agent A sends an XRPL Payment to the operator address with that memo
 *   5. POST /pay/xrpl/confirm relays the proof to Flare and executes the escrow
 *
 * Body: { taskId, serviceId, agentB, xrplAddress, inputItems? }
 */
app.post('/pay/xrpl', async (req, res) => {
  const { taskId, serviceId, agentB, xrplAddress, inputItems } = req.body;

  if (!taskId || !serviceId || !agentB || !xrplAddress) {
    return res.status(400).json({
      error: 'Missing required fields: taskId, serviceId, agentB, xrplAddress',
    });
  }

  if (!masterController) {
    return res.status(503).json({
      error: 'Smart Accounts not configured. Set MASTER_ACCOUNT_CONTROLLER_ADDRESS in .env',
    });
  }

  const spec = getSpec(serviceId);
  if (!spec) return res.status(404).json({ error: `Unknown service: ${serviceId}` });

  const price      = calculatePrice(serviceId, inputItems || 1);
  const specHash   = hashSpec(serviceId);
  const taskIdHash = ethers.keccak256(ethers.toUtf8Bytes(taskId));

  try {
    // Build the CustomCall that will execute Treasury.escrowPayment() from the
    // user's Smart Account on Flare.
    const treasuryIface = new ethers.Interface(TREASURY_ABI);
    const escrowCalldata = treasuryIface.encodeFunctionData('escrowPayment', [
      taskIdHash,
      agentB,
      specHash,
      serviceId,
    ]);

    const customCalls = [
      {
        targetContract: TREASURY_ADDR,
        value:          ethers.parseEther(price.toString()),
        data:           escrowCalldata,
      },
    ];

    // Register the custom instruction on MasterAccountController
    const regTx = await masterController.registerCustomInstruction(customCalls);
    await regTx.wait();
    console.log(`[XRPL] Registered custom instruction: ${regTx.hash}`);

    // Get the encoded call hash (30 bytes, used in payment reference)
    const callHash = await masterController.encodeCustomInstruction(customCalls);

    // Build the 32-byte payment reference: 0xff + walletId(1 byte) + callHash(30 bytes)
    const walletId = '00';
    // callHash is bytes32 — take last 30 bytes (60 hex chars)
    const callHashHex = callHash.slice(2); // remove 0x
    const paymentReference = '0xff' + walletId + callHashHex.slice(4); // skip first 2 bytes

    // Look up the operator XRPL address from the contract if not configured
    let operatorAddr = OPERATOR_XRPL_ADDRESS;
    if (!operatorAddr) {
      const wallets = await masterController.getXrplProviderWallets();
      operatorAddr = wallets[0] || '';
    }

    // Get (or predict) the Smart Account address on Flare for this XRPL address
    const smartAccountAddr = await masterController.getPersonalAccount(xrplAddress);

    // Store pending payment for relay
    pendingXrplPayments.set(taskId, {
      taskId,
      taskIdHash,
      serviceId,
      specHash,
      agentB,
      xrplAddress,
      price,
      paymentReference,
      customCalls,
      smartAccountAddr,
      registeredAt: Date.now(),
    });

    console.log(`[XRPL] Payment reference for task ${taskId}: ${paymentReference}`);

    res.json({
      status:           'awaiting_xrpl_payment',
      taskId,
      taskIdHash,
      paymentReference,
      xrplPayment: {
        destination:    operatorAddr,
        amount:         String(Math.ceil(price * 1_000_000)), // XRP drops
        memoData:       paymentReference.slice(2), // hex without 0x prefix
        memoType:       Buffer.from('text/plain').toString('hex'),
        note:           'Send this exact XRPL Payment. The operator relays it to Flare via Smart Account.',
      },
      smartAccount: {
        flareAddress:   smartAccountAddr,
        controller:     MASTER_ACCOUNT_CONTROLLER_ADDR,
      },
      nextStep:         'POST /pay/xrpl/confirm with { taskId, xrplTxHash }',
    });

  } catch (err) {
    console.error('[XRPL Pay] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /pay/xrpl/confirm
 * After Agent A sends the XRPL Payment, the operator (facilitator) relays the
 * FDC Payment attestation proof to MasterAccountController.executeTransaction(),
 * which triggers the Smart Account to call Treasury.escrowPayment() on Flare.
 *
 * Body: { taskId, xrplTxHash }
 */
app.post('/pay/xrpl/confirm', async (req, res) => {
  const { taskId, xrplTxHash } = req.body;

  if (!taskId || !xrplTxHash) {
    return res.status(400).json({ error: 'Missing required fields: taskId, xrplTxHash' });
  }

  const pending = pendingXrplPayments.get(taskId);
  if (!pending) {
    return res.status(404).json({ error: 'No pending XRPL payment for this task' });
  }

  if (!masterController) {
    return res.status(503).json({ error: 'Smart Accounts not configured' });
  }

  try {
    // Step 1: Verify the XRPL transaction exists and matches
    const xrplClient = new xrpl.Client(XRPL_WSS);
    await xrplClient.connect();

    let xrplTx;
    try {
      const txResponse = await xrplClient.request({
        command: 'tx',
        transaction: xrplTxHash,
      });
      xrplTx = txResponse.result;
    } finally {
      await xrplClient.disconnect();
    }

    if (!xrplTx || xrplTx.validated !== true) {
      return res.status(400).json({ error: 'XRPL transaction not found or not validated' });
    }

    // Verify the memo contains our payment reference
    const memos = xrplTx.Memos || [];
    const memoData = memos[0]?.Memo?.MemoData?.toLowerCase() || '';
    const expectedMemo = pending.paymentReference.slice(2).toLowerCase();
    if (!memoData.includes(expectedMemo)) {
      return res.status(400).json({
        error: 'XRPL transaction memo does not match expected payment reference',
      });
    }

    console.log(`[XRPL] Verified XRPL tx ${xrplTxHash} for task ${taskId}`);

    // Step 2: Request FDC Payment attestation for the XRPL transaction
    // The operator uses the FDC to get an attestation proof that the XRPL
    // payment occurred. This proof is what MasterAccountController needs.
    const VERIFIER_BASE = process.env.VERIFIER_URL_TESTNET ||
      'https://fdc-verifier-testnet.flare.network';
    const VERIFIER_API_KEY = process.env.VERIFIER_API_KEY_TESTNET ||
      '00000000-0000-0000-0000-000000000000';
    const DA_LAYER_BASE = process.env.COSTON2_DA_LAYER_URL ||
      'https://fdc-da-layer-testnet.flare.network';

    // Prepare the Payment attestation request
    const prepareRes = await fetch(
      `${VERIFIER_BASE}/verifier/xrp/Payment/prepareRequest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-apikey': VERIFIER_API_KEY,
        },
        body: JSON.stringify({
          attestationType: '0x5061796d656e7400000000000000000000000000000000000000000000000000', // "Payment"
          sourceId: '0x7465737458525000000000000000000000000000000000000000000000000000', // "testXRP"
          requestBody: {
            transactionId: xrplTxHash,
            inUtxo: '0',
            utxo: '0',
          },
        }),
      }
    );

    if (!prepareRes.ok) {
      const text = await prepareRes.text();
      throw new Error(`FDC verifier prepareRequest failed (${prepareRes.status}): ${text}`);
    }

    const prepareData = await prepareRes.json();
    const abiEncodedRequest = prepareData.abiEncodedRequest;

    // Submit attestation request to FdcHub
    const ContractRegistryABI = ['function getContractAddressByName(string) view returns (address)'];
    const registry = new ethers.Contract(
      '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019',
      ContractRegistryABI,
      signer
    );

    const fdcHubAddr = await registry.getContractAddressByName('FdcHub');
    const fdcHub = new ethers.Contract(
      fdcHubAddr,
      ['function requestAttestation(bytes) payable', 'function getRequestFee() view returns (uint256)'],
      signer
    );

    const fee = await fdcHub.getRequestFee();
    const attestTx = await fdcHub.requestAttestation(abiEncodedRequest, { value: fee });
    const attestReceipt = await attestTx.wait();
    console.log(`[XRPL] FDC attestation submitted: ${attestTx.hash}`);

    // Compute voting round ID
    const block = await provider.getBlock(attestReceipt.blockNumber);
    const fsmAddr = await registry.getContractAddressByName('FlareSystemsManager');
    const fsm = new ethers.Contract(
      fsmAddr,
      ['function firstVotingRoundStartTs() view returns (uint256)', 'function votingEpochDurationSeconds() view returns (uint256)'],
      provider
    );
    const firstRoundStart = Number(await fsm.firstVotingRoundStartTs());
    const epochDuration   = Number(await fsm.votingEpochDurationSeconds());
    const roundId = Math.floor((Number(block.timestamp) - firstRoundStart) / epochDuration);

    // Wait for round finalization
    const relayAddr = await registry.getContractAddressByName('Relay');
    const relay = new ethers.Contract(
      relayAddr,
      ['function isFinalized(uint256, uint256) view returns (bool)'],
      provider
    );

    const deadline = Date.now() + 300_000; // 5 min
    while (Date.now() < deadline) {
      if (await relay.isFinalized(200, roundId)) break;
      console.log(`[XRPL] Waiting for round ${roundId} finalization...`);
      await new Promise(r => setTimeout(r, 10_000));
    }

    if (!(await relay.isFinalized(200, roundId))) {
      throw new Error(`Round ${roundId} not finalized within timeout`);
    }

    // Fetch proof from DA Layer
    let proofData;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const proofRes = await fetch(
        `${DA_LAYER_BASE}/api/v1/fdc/proof-by-request-round-raw`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ votingRoundId: roundId, requestBytes: abiEncodedRequest }),
        }
      );
      if (proofRes.ok) {
        const json = await proofRes.json();
        if (json.proof && json.response_hex) {
          proofData = json;
          break;
        }
      }
      if (attempt < 5) await new Promise(r => setTimeout(r, 10_000));
    }

    if (!proofData) {
      throw new Error('Failed to retrieve FDC Payment proof from DA Layer');
    }

    console.log(`[XRPL] FDC Payment proof retrieved for round ${roundId}`);

    // Step 3: Decode proof and call MasterAccountController.executeTransaction()
    // This triggers the Smart Account to execute the registered CustomCall
    // (Treasury.escrowPayment) on Flare.
    const IPaymentVerificationABI = [
      'function verifyPayment(tuple(bytes32[] merkleProof, tuple(bytes32 attestationType, bytes32 sourceId, uint64 votingRound, uint64 lowestUsedTimestamp, tuple(uint64 blockNumber, uint64 blockTimestamp, bytes32 sourceAddressHash, bytes32 receivingAddressHash, bytes32 intendedReceivingAddressHash, uint256 spentAmount, uint256 intendedSpentAmount, uint256 receivingAmount, uint256 intendedReceivingAmount, bytes32 standardPaymentReference, bool oneToOne, uint8 status) responseBody) data) proof) view returns (bool)',
    ];

    // Decode the response_hex into the Payment proof structure
    const paymentResponseType =
      'tuple(bytes32 attestationType, bytes32 sourceId, uint64 votingRound, uint64 lowestUsedTimestamp, tuple(uint64 blockNumber, uint64 blockTimestamp, bytes32 sourceAddressHash, bytes32 receivingAddressHash, bytes32 intendedReceivingAddressHash, uint256 spentAmount, uint256 intendedSpentAmount, uint256 receivingAmount, uint256 intendedReceivingAmount, bytes32 standardPaymentReference, bool oneToOne, uint8 status) responseBody)';

    const decodedResponse = ethers.AbiCoder.defaultAbiCoder().decode(
      [paymentResponseType],
      proofData.response_hex
    )[0];

    const paymentProof = {
      merkleProof: proofData.proof,
      data: decodedResponse,
    };

    // Execute the Smart Account transaction on Flare
    const executeTx = await masterController.executeTransaction(
      paymentProof,
      pending.xrplAddress
    );
    await executeTx.wait();
    console.log(`[XRPL] Smart Account executed on Flare: ${executeTx.hash}`);

    // Track task locally (same as direct Flare payment)
    tasks.set(taskId, {
      taskIdHash:    pending.taskIdHash,
      serviceId:     pending.serviceId,
      specHash:      pending.specHash,
      agentB:        pending.agentB,
      price:         pending.price,
      status:        'escrowed',
      startTime:     Date.now(),
      txHash:        executeTx.hash,
      paymentMethod: 'xrpl-smart-account',
      xrplTxHash,
      xrplAddress:   pending.xrplAddress,
      smartAccount:  pending.smartAccountAddr,
    });

    pendingXrplPayments.delete(taskId);

    res.json({
      status:        'escrowed',
      taskId,
      taskIdHash:    pending.taskIdHash,
      txHash:        executeTx.hash,
      specHash:      pending.specHash,
      paymentMethod: 'xrpl-smart-account',
      xrplTxHash,
      smartAccount:  pending.smartAccountAddr,
      fdcRoundId:    roundId,
      message:       'XRPL payment relayed via Smart Account. Treasury escrow confirmed on Flare. Agent B can now start the task.',
    });

  } catch (err) {
    console.error('[XRPL Confirm] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /smart-account/:xrplAddress
 * Look up the Flare Smart Account address for an XRPL wallet.
 */
app.get('/smart-account/:xrplAddress', async (req, res) => {
  if (!masterController) {
    return res.status(503).json({ error: 'Smart Accounts not configured' });
  }

  try {
    const flareAddress = await masterController.getPersonalAccount(req.params.xrplAddress);
    const operatorWallets = await masterController.getXrplProviderWallets();

    res.json({
      xrplAddress:     req.params.xrplAddress,
      flareAddress,
      operatorWallets,
      controller:      MASTER_ACCOUNT_CONTROLLER_ADDR,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TASK EXECUTION ROUTES ───────────────────���──────────────────────────────

/**
 * POST /submit
 * Agent B submits task output. TEE verifies against committed spec.
 */
app.post('/submit', async (req, res) => {
  const { taskId, output } = req.body;

  if (!taskId || !output) {
    return res.status(400).json({ error: 'Missing required fields: taskId, output' });
  }

  const task = tasks.get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status !== 'escrowed') {
    return res.status(400).json({ error: `Task status is ${task.status}, expected escrowed` });
  }

  // ── TEE VERIFICATION ──────────────────────────────────────────────────────
  // In production: this runs inside Flare AI Kit TEE (Intel TDX)
  // For hackathon: runs locally but produces the same attestation format

  const verification = verifyAgainstSpec(task.serviceId, output, {
    startTime:  task.startTime,
    inputCount: output.results?.length || output.translations?.length || 1,
  });

  // Create attestation hash
  const outputHash = '0x' + createHash('sha256')
    .update(JSON.stringify(output))
    .digest('hex');

  const attestationHash = '0x' + createHash('sha256')
    .update(JSON.stringify({
      taskId:     task.taskIdHash,
      specHash:   task.specHash,
      outputHash,
      passed:     verification.passed,
      score:      verification.score,
      timestamp:  Date.now(),
    }))
    .digest('hex');

  try {
    // Submit attestation to Treasury.sol
    const tx = await treasury.submitAttestation(
      task.taskIdHash,
      attestationHash,
      outputHash,
      verification.passed,
      verification.score
    );
    await tx.wait();

    task.status          = verification.passed ? 'settled' : 'failed';
    task.attestationHash = attestationHash;
    task.verification    = verification;
    task.settleTxHash    = tx.hash;

    res.json({
      status:       task.status,
      taskId,
      verification,
      attestationHash,
      txHash:       tx.hash,
      message:      verification.passed
        ? 'Task verified and settled. Agent B paid, levy routed to treasury.'
        : 'Task failed verification. Funds remain in escrow.',
    });

  } catch (err) {
    console.error('[Submit] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /status/:taskId
 * Check task status. Used by FDC Web2Json attestation endpoint.
 *
 * Returns fields matching the FDC abiSignature in oracle/fdcVerify.js:
 *   (bool taskExists, string taskId, string status, uint256 completedAt)
 *
 * Also includes extended fields for dashboard / debugging.
 */
app.get('/status/:taskId', (req, res) => {
  const task = tasks.get(req.params.taskId);
  if (!task) {
    return res.json({
      taskExists:  false,
      taskId:      req.params.taskId,
      status:      'NonExistent',
      completedAt: 0,
    });
  }

  const completedAt = task.status === 'settled'
    ? Math.floor(Date.now() / 1000)
    : 0;

  res.json({
    // FDC-attested fields (match abiSignature)
    taskExists:      true,
    taskId:          req.params.taskId,
    status:          task.status,
    completedAt,
    // Extended fields
    taskIdHash:      task.taskIdHash,
    serviceId:       task.serviceId,
    specHash:        task.specHash,
    price:           task.price,
    attestationHash: task.attestationHash || null,
    verification:    task.verification || null,
    escrowTxHash:    task.txHash,
    settleTxHash:    task.settleTxHash || null,
    startTime:       new Date(task.startTime).toISOString(),
  });
});

/**
 * GET /spec/:serviceId
 * Return the full spec for a service type.
 */
app.get('/spec/:serviceId', (req, res) => {
  const spec = getSpec(req.params.serviceId);
  if (!spec) return res.status(404).json({ error: 'Service not found' });
  return res.json({
    serviceId: req.params.serviceId,
    specHash:  hashSpec(req.params.serviceId),
    spec,
  });
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    protocol:  'AgentLevy x402 Facilitator v3',
    treasury:  TREASURY_ADDR,
    services:  listServices().length,
    network:   'Coston2 testnet',
    smartAccounts: {
      enabled:    !!masterController,
      controller: MASTER_ACCOUNT_CONTROLLER_ADDR || null,
      operator:   OPERATOR_XRPL_ADDRESS || null,
    },
    trustPrimitive: 'spec-commitment + TEE-verification + PMW-release',
    paymentPaths: ['flare-native (C2FLR)', 'xrpl-smart-account'],
  });
});

// ─── START ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n[AgentLevy] x402 Facilitator v3 running`);
  console.log(`[AgentLevy] Port:        ${PORT}`);
  console.log(`[AgentLevy] Treasury:    ${TREASURY_ADDR}`);
  console.log(`[AgentLevy] Services:    ${listServices().map(s => s.id).join(', ')}`);
  console.log(`[AgentLevy] Smart Accts: ${masterController ? 'ENABLED' : 'DISABLED (set MASTER_ACCOUNT_CONTROLLER_ADDRESS)'}`);
  if (masterController) {
    console.log(`[AgentLevy] Controller:  ${MASTER_ACCOUNT_CONTROLLER_ADDR}`);
    console.log(`[AgentLevy] XRPL Op:     ${OPERATOR_XRPL_ADDRESS || '(auto-detect from contract)'}`);
  }
  console.log(`[AgentLevy] Payment paths: Flare-native (C2FLR), XRPL Smart Account`);
  console.log(`[AgentLevy] Trust primitive: spec-commitment + TEE-verification + PMW-release\n`);
});

export default app;

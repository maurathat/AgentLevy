/**
 * AgentLevy — Agent Wallet Manager
 *
 * Handles agent wallet creation and registration.
 * Each agent gets an XRPL wallet for receiving RLUSD payments.
 * For the hackathon: operator holds the key.
 * For production: key lives in TEE — nobody has it.
 *
 * Also includes mock Agent A and Agent B for demo purposes.
 */

import * as xrpl from 'xrpl';
import { ethers } from 'ethers';
import 'dotenv/config';

const XRPL_TESTNET  = 'wss://s.altnet.rippletest.net:51233';
const FACILITATOR   = process.env.FACILITATOR_URL || 'http://localhost:3001';

// ─── AGENT WALLET REGISTRATION ───────────────────────────────────────────────

/**
 * Create and register a new agent wallet on XRPL testnet.
 * In production: private key generated inside TEE, never exposed.
 */
export async function registerAgent(agentId, operatorAddress) {
  const client = new xrpl.Client(XRPL_TESTNET);
  await client.connect();

  try {
    const wallet = xrpl.Wallet.generate();

    console.log(`[AgentWallet] Funding ${agentId} from testnet faucet...`);
    await client.fundWallet(wallet);

    console.log(`[AgentWallet] Agent registered:
      ID:       ${agentId}
      Address:  ${wallet.address}
      Operator: ${operatorAddress}
      ⚠️  Store private key securely: ${wallet.seed}
    `);

    await client.disconnect();
    return {
      agentId,
      address:  wallet.address,
      seed:     wallet.seed,
      operator: operatorAddress,
    };

  } catch (err) {
    await client.disconnect();
    throw err;
  }
}

// ─── MOCK AGENT A (task requester) ───────────────────────────────────────────

/**
 * Simulates Agent A requesting and paying for a task.
 * This is the full x402 flow from the payer's perspective.
 */
async function mockAgentA(serviceId = 'sentiment-analysis') {
  console.log(`\n[Agent A] Requesting service: ${serviceId}`);

  // Step 1: Request task — get 402
  const taskRes = await fetch(`${FACILITATOR}/task/${serviceId}`);
  const taskData = await taskRes.json();

  if (taskRes.status !== 402) {
    console.error('[Agent A] Expected 402, got:', taskRes.status);
    return;
  }

  console.log(`[Agent A] Got 402 Payment Required`);
  console.log(`[Agent A] Price: ${taskData.pricing.totalDue} RLUSD`);
  console.log(`[Agent A] Spec hash: ${taskData.specHash}`);
  console.log(`[Agent A] Levy included: ${taskData.pricing.levyIncluded} RLUSD`);

  // Step 2: Pay
  const agentBAddress = process.env.AGENT_B_ADDRESS || '0x0000000000000000000000000000000000000001';

  const payRes = await fetch(`${FACILITATOR}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId:     taskData.taskId,
      serviceId,
      agentB:     agentBAddress,
      inputItems: 100,
    }),
  });
  const payData = await payRes.json();

  console.log(`[Agent A] Payment escrowed: ${payData.txHash}`);
  return { taskId: taskData.taskId, ...payData };
}

// ─── MOCK AGENT B (task worker) ──────────────────────────────────────────────

/**
 * Simulates Agent B completing a task and submitting output.
 * The output is verified by the TEE against the committed spec.
 */
async function mockAgentB(taskId, serviceId = 'sentiment-analysis') {
  console.log(`\n[Agent B] Working on task: ${taskId}`);

  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate mock output that passes spec verification
  let output;

  if (serviceId === 'sentiment-analysis') {
    output = {
      results: Array.from({ length: 100 }, (_, i) => ({
        id:    `item-${i}`,
        score: Math.random() * 2 - 1,   // -1 to 1
        label: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
      })),
      summary: {
        totalAnalyzed: 100,
        avgScore: 0.15,
        distribution: { positive: 40, negative: 30, neutral: 30 },
      },
    };
  } else if (serviceId === 'code-review') {
    output = {
      issues: [
        { file: 'main.js', line: 42, severity: 'high', message: 'Unhandled promise rejection', rule: 'no-floating-promises' },
        { file: 'utils.js', line: 17, severity: 'medium', message: 'Unused variable', rule: 'no-unused-vars' },
      ],
      summary: { totalIssues: 2, bySeverity: { high: 1, medium: 1 } },
    };
  } else {
    output = { results: [{ id: 'generic', data: 'completed' }] };
  }

  // Submit to facilitator
  const submitRes = await fetch(`${FACILITATOR}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, output }),
  });
  const submitData = await submitRes.json();

  console.log(`[Agent B] Verification: ${submitData.verification?.passed ? 'PASSED' : 'FAILED'}`);
  console.log(`[Agent B] Score: ${submitData.verification?.score}`);
  console.log(`[Agent B] Status: ${submitData.status}`);
  console.log(`[Agent B] Attestation: ${submitData.attestationHash}`);

  return submitData;
}

// ─── FULL DEMO ───────────────────────────────────────────────────────────────

async function runFullDemo() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  AgentLevy Protocol — Full Demo');
  console.log('  x402 + Flare TEE + XRPL + Protocol Managed Wallet');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Agent A requests and pays
    const payment = await mockAgentA('sentiment-analysis');
    if (!payment) return;

    // Agent B completes and submits
    const result = await mockAgentB(payment.taskId, 'sentiment-analysis');

    console.log('\n────────────────────────────────────────────────────────');
    console.log('  Demo Complete');
    console.log('────────────────────────────────────────────────────────');
    console.log(`  Task:        ${payment.taskId}`);
    console.log(`  Status:      ${result.status}`);
    console.log(`  Attestation: ${result.attestationHash}`);
    console.log(`  Escrow TX:   ${payment.txHash}`);
    console.log(`  Settle TX:   ${result.txHash}`);
    console.log('────────────────────────────────────────────────────────');
    console.log('  Check Taxai dashboard for levy record.');

  } catch (err) {
    console.error('[Demo] Error:', err.message);
  }
}

// Run demo if called directly
if (process.argv[2] === '--demo') {
  runFullDemo();
}

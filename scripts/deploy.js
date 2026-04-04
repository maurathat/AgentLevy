/**
 * AgentLevy — Deploy Script
 * Deploys Treasury.sol to Coston2 testnet
 *
 * Run: npx hardhat run scripts/deploy.js --network coston2
 *
 * Prerequisites:
 * - PRIVATE_KEY in .env (funded with C2FLR from faucet.towolabs.com)
 * - COSTON2_RPC in .env
 */

import hre from "hardhat";

async function main() {
  console.log("\n[Deploy] Deploying AgentLevy Treasury to Coston2 testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`[Deploy] Deploying with account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`[Deploy] Account balance: ${hre.ethers.formatEther(balance)} C2FLR\n`);

  // Deploy Treasury contract
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();

  const address = await treasury.getAddress();
  console.log(`[Deploy] ✅ Treasury deployed to: ${address}`);
  console.log(`[Deploy] Add to your .env: TREASURY_ADDRESS=${address}\n`);

  // Verify initial state
  const levyBps     = await treasury.levyBasisPoints();
  const owner       = await treasury.owner();
  const isVerified  = await treasury.verifiedTEEs(deployer.address);

  console.log(`[Deploy] Initial state:`);
  console.log(`  Owner:           ${owner}`);
  console.log(`  Levy rate:       ${levyBps} basis points (${Number(levyBps) / 100}%)`);
  console.log(`  Deployer as TEE: ${isVerified} (testnet only)\n`);

  console.log(`[Deploy] Next steps:`);
  console.log(`  1. Add TREASURY_ADDRESS=${address} to .env`);
  console.log(`  2. Start facilitator: node sdk/x402Facilitator.js`);
  console.log(`  3. Run demo: node sdk/agentWallet.js --demo`);
  console.log(`  4. Open Taxai dashboard: cd dashboard && npm start\n`);

  // Save deployment info
  const { default: fs } = await import("fs");
  const dir = "./deployments";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const deployInfo = {
    network:   "coston2",
    address,
    deployer:  deployer.address,
    timestamp: new Date().toISOString(),
    levyBps:   levyBps.toString(),
  };

  fs.writeFileSync(
    `${dir}/coston2.json`,
    JSON.stringify(deployInfo, null, 2)
  );
  console.log(`[Deploy] Deployment info saved to deployments/coston2.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

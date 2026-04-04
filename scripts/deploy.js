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
  console.log("\n[Deploy] Deploying AgentLevy contracts to Coston2 testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`[Deploy] Deploying with account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`[Deploy] Account balance: ${hre.ethers.formatEther(balance)} C2FLR\n`);

  // Deploy Treasury contract
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log(`[Deploy] ✅ Treasury deployed to:     ${treasuryAddress}`);

  // Deploy TaskRegistry contract
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy();
  await taskRegistry.waitForDeployment();
  const taskRegistryAddress = await taskRegistry.getAddress();
  console.log(`[Deploy] ✅ TaskRegistry deployed to: ${taskRegistryAddress}`);

  // Verify Treasury initial state
  const levyBps    = await treasury.levyBasisPoints();
  const owner      = await treasury.owner();
  const isVerified = await treasury.verifiedTEEs(deployer.address);

  console.log(`\n[Deploy] Treasury state:`);
  console.log(`  Owner:           ${owner}`);
  console.log(`  Levy rate:       ${levyBps} basis points (${Number(levyBps) / 100}%)`);
  console.log(`  Deployer as TEE: ${isVerified} (testnet only)`);

  console.log(`\n[Deploy] Add these to agents/.env:`);
  console.log(`  TREASURY_ADDRESS=${treasuryAddress}`);
  console.log(`  TASK_REGISTRY_ADDRESS=${taskRegistryAddress}`);
  console.log(`  VERIFIER_ADDRESS=${taskRegistryAddress}  # same contract`);
  console.log(`  USDC_ADDRESS=<coston2-usdc-address>\n`);

  // Save deployment info
  const { default: fs } = await import("fs");
  const dir = "./deployments";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const deployInfo = {
    network:             "coston2",
    treasury:            treasuryAddress,
    taskRegistry:        taskRegistryAddress,
    verifier:            taskRegistryAddress,
    deployer:            deployer.address,
    timestamp:           new Date().toISOString(),
    levyBps:             levyBps.toString(),
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

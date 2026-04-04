import hre from "hardhat"
import { readFileSync, writeFileSync } from "fs"
import { parseUnits } from "viem"

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log(`[Deploy] Deploying MockUSDC with account: ${deployer.address}`)

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC")
  const usdc     = await MockUSDC.deploy()
  await usdc.waitForDeployment()

  const address = await usdc.getAddress()
  console.log(`[Deploy] ✅ MockUSDC deployed to: ${address}`)

  // Mint 1000 USDC to the deployer (Agent A wallet)
  const amount = parseUnits("1000", 6)
  await usdc.mint(deployer.address, amount)
  console.log(`[Deploy] Minted 1000 USDC to ${deployer.address}`)

  // Update deployments/coston2.json
  const path       = "./deployments/coston2.json"
  const deployment = JSON.parse(readFileSync(path, "utf8"))
  deployment.mockUsdc = address
  writeFileSync(path, JSON.stringify(deployment, null, 2))

  console.log(`\n[Deploy] Add to agents/.env:`)
  console.log(`  USDC_ADDRESS=${address}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1) })

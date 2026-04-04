import hre from "hardhat"
import { readFileSync, writeFileSync } from "fs"
import { parseUnits } from "viem"

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log(`[Deploy] Deploying MockUSDT0 with account: ${deployer.address}`)

  const MockUSDT0 = await hre.ethers.getContractFactory("MockUSDT0")
  const usdc     = await MockUSDT0.deploy()
  await usdc.waitForDeployment()

  const address = await usdc.getAddress()
  console.log(`[Deploy] ✅ MockUSDT0 deployed to: ${address}`)

  // Mint 1000 USDT0 to the deployer (Agent A wallet)
  const amount = parseUnits("1000", 6)
  await usdc.mint(deployer.address, amount)
  console.log(`[Deploy] Minted 1000 USDT0 to ${deployer.address}`)

  // Update deployments/coston2.json
  const path       = "./deployments/coston2.json"
  const deployment = JSON.parse(readFileSync(path, "utf8"))
  deployment.mockUsdt0 = address
  writeFileSync(path, JSON.stringify(deployment, null, 2))

  console.log(`\n[Deploy] Add to agents/.env:`)
  console.log(`  USDT0_ADDRESS=${address}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1) })

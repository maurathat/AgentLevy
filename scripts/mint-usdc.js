import hre from "hardhat"
import { parseUnits } from "viem"
import { readFileSync } from "fs"
import * as dotenv from "dotenv"

dotenv.config({ path: "./agents/.env" })

async function main() {
  const deployment = JSON.parse(readFileSync("./deployments/coston2.json", "utf8"))
  const usdcAddress = deployment.mockUsdt0

  if (!usdcAddress) {
    throw new Error("mockUsdt0 not found in deployments/coston2.json — run deploy-mock-usdc.js first")
  }

  const agentAAddress = process.env.AGENT_A_PRIVATE_KEY
    ? (await import("viem/accounts")).privateKeyToAccount(process.env.AGENT_A_PRIVATE_KEY).address
    : null

  if (!agentAAddress) {
    throw new Error("AGENT_A_PRIVATE_KEY not set in agents/.env")
  }

  const usdc   = await hre.ethers.getContractAt("MockUSDT0", usdcAddress)
  const amount = parseUnits("1000", 6) // 1000 USDT0

  const tx = await usdc.mint(agentAAddress, amount)
  await tx.wait()

  console.log(`[Mint] ✅ Minted 1000 USDT0 to Agent A: ${agentAAddress}`)
  console.log(`[Mint] USDT0 contract: ${usdcAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1) })

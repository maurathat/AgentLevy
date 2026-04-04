import "dotenv/config";

import { spawn } from "node:child_process";

import { getKeychainSecret } from "../services/keychain.js";

const cliCommand = process.env.ZEROCLAW_0G_COMPUTE_CLI?.trim() || "0g-compute-cli";
const cliArgs = ["login"];
const serviceName =
  process.env.ZEROCLAW_STEVE_ZC_KEYCHAIN_SERVICE?.trim() || "Steve_ZC_PRIVATE_KEY";
const accountName = process.env.ZEROCLAW_KEYCHAIN_ACCOUNT?.trim() || "zeroclaw";

async function main(): Promise<void> {
  const privateKey = getKeychainSecret(serviceName, accountName);

  const child = spawn(cliCommand, cliArgs, {
    stdio: ["pipe", "inherit", "inherit"],
    env: process.env,
  });

  child.on("error", (error) => {
    console.error(
      `Failed to start ${cliCommand}. If it is installed outside your PATH, set ZEROCLAW_0G_COMPUTE_CLI.`,
    );
    console.error(String(error));
    process.exitCode = 1;
  });

  child.stdin.write(`${privateKey}\n`);
  child.stdin.end();

  const exitCode: number = await new Promise((resolve) => {
    child.on("close", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

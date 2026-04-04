import "dotenv/config";

import { Wallet } from "ethers";

import { getKeychainSecret, hasKeychainSecret } from "../services/keychain.js";

function env(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

function printCheck(label: string, ok: boolean, detail: string): void {
  const status = ok ? "OK " : "MISS";
  console.log(`[${status}] ${label}: ${detail}`);
}

function inferenceConfig(
  keySuffix: "STEVE_ZC" | "WOZ_ZC",
  allowSharedFallback: boolean,
): { url: string; model: string; apiKey: string } {
  return {
    url: allowSharedFallback
      ? env(`ZEROCLAW_${keySuffix}_INFERENCE_URL`) || env("ZEROCLAW_INFERENCE_URL")
      : env(`ZEROCLAW_${keySuffix}_INFERENCE_URL`),
    model: allowSharedFallback
      ? env(`ZEROCLAW_${keySuffix}_INFERENCE_MODEL`) || env("ZEROCLAW_INFERENCE_MODEL")
      : env(`ZEROCLAW_${keySuffix}_INFERENCE_MODEL`),
    apiKey: allowSharedFallback
      ? env(`ZEROCLAW_${keySuffix}_INFERENCE_API_KEY`) || env("ZEROCLAW_INFERENCE_API_KEY")
      : env(`ZEROCLAW_${keySuffix}_INFERENCE_API_KEY`),
  };
}

function main(): void {
  const keychainAccount = env("ZEROCLAW_KEYCHAIN_ACCOUNT", "zeroclaw");
  const steveService = env("ZEROCLAW_STEVE_ZC_KEYCHAIN_SERVICE", "Steve_ZC_PRIVATE_KEY");
  const wozService = env("ZEROCLAW_WOZ_ZC_KEYCHAIN_SERVICE", "Woz_ZC_PRIVATE_KEY");
  const expectedSteveAddress = env(
    "ZEROCLAW_STEVE_ZC_EXPECTED_ADDRESS",
    "0x5b340a8553d08B65Cebf303514B0415E3aD1E8f7",
  );
  const expectedWozAddress = env("ZEROCLAW_WOZ_ZC_EXPECTED_ADDRESS");
  const paymentMode = env("ZEROCLAW_PAYMENT_MODE", "dry-run");

  console.log("ZeroClaw demo doctor\n");

  const apiPort = env("ZEROCLAW_API_PORT", "8787");
  printCheck("API port", true, `Demo server will listen on http://localhost:${apiPort}`);

  const rpcUrl = env("ZEROCLAW_0G_RPC_URL", "https://evmrpc-testnet.0g.ai");
  printCheck("0G RPC", true, rpcUrl);

  const hasSteveKey = hasKeychainSecret(steveService, keychainAccount);
  printCheck(
    "Steve_ZC key",
    hasSteveKey,
    hasSteveKey
      ? `Found in macOS Keychain (${keychainAccount}/${steveService})`
      : `Add it with: security add-generic-password -a "${keychainAccount}" -s "${steveService}" -w "<PRIVATE_KEY>" -U`,
  );

  if (hasSteveKey) {
    try {
      const privateKey = getKeychainSecret(steveService, keychainAccount);
      const wallet = new Wallet(privateKey);
      const matches = wallet.address.toLowerCase() === expectedSteveAddress.toLowerCase();
      printCheck(
        "Steve_ZC expected address",
        matches,
        matches
          ? `Matches ${expectedSteveAddress}`
          : `Keychain private key resolves to ${wallet.address}, expected ${expectedSteveAddress}`,
      );
    } catch (error) {
      printCheck("Steve_ZC expected address", false, String(error));
    }
  }

  const hasWozKey = hasKeychainSecret(wozService, keychainAccount);
  printCheck(
    "Woz_ZC key",
    hasWozKey,
    hasWozKey
      ? `Found in macOS Keychain (${keychainAccount}/${wozService})`
      : `Add it with: security add-generic-password -a "${keychainAccount}" -s "${wozService}" -w "<PRIVATE_KEY>" -U`,
  );

  if (hasWozKey && expectedWozAddress) {
    try {
      const privateKey = getKeychainSecret(wozService, keychainAccount);
      const wallet = new Wallet(privateKey);
      const matches = wallet.address.toLowerCase() === expectedWozAddress.toLowerCase();
      printCheck(
        "Woz_ZC expected address",
        matches,
        matches
          ? `Matches ${expectedWozAddress}`
          : `Keychain private key resolves to ${wallet.address}, expected ${expectedWozAddress}`,
      );
    } catch (error) {
      printCheck("Woz_ZC expected address", false, String(error));
    }
  }

  const steveInference = inferenceConfig("STEVE_ZC", true);
  const wozInference = inferenceConfig("WOZ_ZC", false);
  const steveInferenceReady = Boolean(steveInference.url && steveInference.model && steveInference.apiKey);
  const wozInferenceReady = Boolean(wozInference.url && wozInference.model && wozInference.apiKey);
  printCheck(
    "Steve_ZC inference",
    steveInferenceReady,
    steveInferenceReady
      ? `Configured for model ${steveInference.model}`
      : "Optional. Set ZEROCLAW_STEVE_ZC_INFERENCE_* or shared ZEROCLAW_INFERENCE_* values.",
  );
  printCheck(
    "Woz_ZC inference",
    wozInferenceReady,
    wozInferenceReady
      ? `Configured for model ${wozInference.model}`
      : "Required for a separate worker compute identity. Set ZEROCLAW_WOZ_ZC_INFERENCE_* values.",
  );

  const livePayments = paymentMode === "live";
  printCheck(
    "Payment mode",
    true,
    livePayments
      ? "LIVE: Steve_ZC will broadcast 0G transfers and needs funds on-chain."
      : "DRY-RUN: payment is simulated, which is safer for local demo work.",
  );

  console.log("\nNext steps:");
  console.log("1. Run `npm install` inside `0G-agents`.");
  console.log("2. Copy `.env.example` to `.env` and adjust values if your team uses different wallets.");
  console.log("3. Add the Steve_ZC private key to macOS Keychain.");
  console.log("4. Add the Woz_ZC private key to macOS Keychain.");
  console.log("5. Run `npm run demo:server`.");
}

main();

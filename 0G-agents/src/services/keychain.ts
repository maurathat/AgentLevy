import { spawnSync } from "node:child_process";

const defaultAccount = (): string => process.env.ZEROCLAW_KEYCHAIN_ACCOUNT?.trim() || "zeroclaw";

function runSecurityCommand(args: string[]): string {
  const result = spawnSync("security", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || "security command failed");
  }

  return result.stdout.trim();
}

/**
 * Retrieves a secret from macOS Keychain.
 * Secrets are stored encrypted and protected by your login password / Touch ID.
 *
 * Usage: await getKeychainSecret("AGENT_PRIVATE_KEY")
 */
export function getKeychainSecret(service: string, account = defaultAccount()): string {
  try {
    return runSecurityCommand(["find-generic-password", "-a", account, "-s", service, "-w"]);
  } catch {
    throw new Error(
      `Secret "${service}" not found in macOS Keychain.\n` +
      `Store it with: security add-generic-password -a "${account}" -s "${service}" -w "YOUR_SECRET" -U`
    );
  }
}

/**
 * Stores a secret in macOS Keychain.
 * The -U flag updates the entry if it already exists.
 */
export function setKeychainSecret(service: string, value: string, account = defaultAccount()): void {
  runSecurityCommand(["add-generic-password", "-a", account, "-s", service, "-w", value, "-U"]);
}

/**
 * Checks if a secret exists in macOS Keychain.
 */
export function hasKeychainSecret(service: string, account = defaultAccount()): boolean {
  try {
    getKeychainSecret(service, account);
    return true;
  } catch {
    return false;
  }
}

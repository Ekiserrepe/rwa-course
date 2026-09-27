// 01-create-accounts.js: six funded testnet accounts, saved to .env
//
//   ISSUER    the cold account that issues the asset token (never trades)
//   TREASURY  the issuer's hot wallet: holds unsold supply, sells, pays out
//   ALICE     an investor who passes KYC
//   BOB       a second investor who passes KYC
//   CAROL     someone who never passes KYC
//   STABLE    issues the USD stablecoin that investors settle in
const fs = require("fs");
const path = require("path");

// Always examples/.env, whichever folder this is run from
const ENV_FILE = path.join(__dirname, ".env");

const ROLES = ["ISSUER", "TREASURY", "ALICE", "BOB", "CAROL", "STABLE"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function faucet() {
  const res = await fetch("https://xahau-test.net/accounts", { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (body.account) return body.account;
  // The faucet rate-limits: wait and try again
  console.log("  faucet busy:", body.error ?? res.status);
  await sleep(15_000);
  return faucet();
}

async function main() {
  const lines = ["NETWORK=wss://xahau-test.net"];
  for (const role of ROLES) {
    const account = await faucet();
    console.log(`${role.padEnd(9)} ${account.address}`);
    lines.push(`${role}_SEED=${account.secret}`);
  }
  // Never lose earlier seeds silently: keep the previous file next to it
  if (fs.existsSync(ENV_FILE)) {
    fs.copyFileSync(ENV_FILE, `${ENV_FILE}.bak`);
    fs.chmodSync(`${ENV_FILE}.bak`, 0o600);
    console.log("\nPrevious .env kept as .env.bak");
  }
  // Seeds: readable by their owner only (mode 600)
  fs.writeFileSync(ENV_FILE, lines.join("\n") + "\n", { mode: 0o600 });
  fs.chmodSync(ENV_FILE, 0o600);
  console.log("\nSaved to .env (testnet funds only, 1,000 XAH each).");
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

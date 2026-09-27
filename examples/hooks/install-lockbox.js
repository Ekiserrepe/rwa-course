// install-lockbox.js: create the VAULT account and put the lockbox Hook on it
//   node hooks/install-lockbox.js
//   node hooks/install-lockbox.js --remove
//
// The vault is a dedicated account: every HBOND it holds is locked HBOND. The
// first run creates it (50 XAH from the TREASURY), saves VAULT_SEED to .env,
// opens its HBOND trust line and has the issuer authorise it, like any holder.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
const { Wallet, xahToDrops } = require("xahau");
const { connect, wallet, submit, trustLine, bond, BOND_CODE, ENV_FILE, writeSecret } = require("../lib/xahau");
const { install, remove, currencyBytes, accountBytes, param } = require("./lib");

const tfSetfAuth = 0x00010000;

async function main() {
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");

  if (process.argv.includes("--remove")) {
    await remove(client, wallet("VAULT_SEED"), "remove lockbox");
    return client.disconnect();
  }

  // 1. The vault account, created once. The seed is saved BEFORE any XAH is
  //    sent, so a failure can never leave a funded account nobody can sign for.
  if (!process.env.VAULT_SEED) {
    const w = Wallet.generate("ecdsa-secp256k1");
    writeSecret(ENV_FILE, `VAULT_SEED=${w.seed}\n`, { append: true });
    process.env.VAULT_SEED = w.seed;
    console.log(`  VAULT ${w.address} (seed saved to .env)`);
  }
  const vault = wallet("VAULT_SEED");
  const exists = await client.request({ command: "account_info", account: vault.address, ledger_index: "validated" })
    .then(() => true, (err) => (err.data?.error === "actNotFound" ? false : Promise.reject(err)));
  if (!exists) {
    await submit(client, wallet("TREASURY_SEED"), {
      TransactionType: "Payment", Destination: vault.address, Amount: xahToDrops(50),
    }, "create VAULT with 50 XAH");
  }

  // 2. An authorised HBOND trust line, exactly as for an investor
  const line = await trustLine(client, vault.address, issuer.address, BOND_CODE);
  if (!line) {
    await submit(client, vault, { TransactionType: "TrustSet", LimitAmount: bond(1_000_000) }, "vault: trust line");
  }
  if (!line?.peer_authorized) {
    await submit(client, issuer, {
      TransactionType: "TrustSet",
      LimitAmount: { currency: BOND_CODE, issuer: vault.address, value: "0" },
      Flags: tfSetfAuth,
    }, "issuer: authorise vault");
  }

  // 3. The Hook, on every transaction type: a list would leave out some route
  //    (a Remit, a URIToken purchase…) by which the vault's key could move tokens
  await install(client, vault, "lockbox", {
    on: "all",
    params: [param("TOK", currencyBytes(BOND_CODE) + accountBytes(issuer.address))],
  });
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

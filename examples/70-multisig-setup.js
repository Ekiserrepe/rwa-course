// 70-multisig-setup.js: the ISSUER can only act with 2 of 3 officers' signatures
//   node 70-multisig-setup.js
//
// Three signer keys are created offline (they need no XAH: signers never pay)
// and saved to .env. SignerListSet makes any two of them enough to sign for
// the issuer. The master key still works until you disable it (see lesson).
//
// Run first (from examples/):
//   node 01-create-accounts.js
const fs = require("fs");
const { Wallet } = require("xahau");
const { connect, wallet, fromSeed, submit, ENV_FILE, writeSecret } = require("./lib/xahau");

async function main() {
  const env = fs.readFileSync(ENV_FILE, "utf8");
  const officers = ["CFO", "COO", "COUNSEL"].map((role) => {
    const existing = process.env[`${role}_SEED`];
    const w = existing ? fromSeed(existing) : Wallet.generate("ecdsa-secp256k1");
    if (!existing) writeSecret(ENV_FILE, `${env.endsWith("\n") ? "" : "\n"}${role}_SEED=${w.seed}\n`, { append: true });
    console.log(`${role.padEnd(8)} ${w.address}${existing ? "" : "  (new, saved to .env)"}`);
    return w;
  });

  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  await submit(client, issuer, {
    TransactionType: "SignerListSet",
    SignerQuorum: 2,
    SignerEntries: officers.map((w) => ({ SignerEntry: { Account: w.address, SignerWeight: 1 } })),
  }, "issuer: 2-of-3 signer list");

  const { account_objects } = (await client.request({
    command: "account_objects", account: issuer.address, type: "signer_list", ledger_index: "validated",
  })).result;
  console.log(`  quorum ${account_objects[0].SignerQuorum}, ${account_objects[0].SignerEntries.length} signers`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

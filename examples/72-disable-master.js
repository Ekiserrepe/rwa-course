// 72-disable-master.js: disable an account's master key, on a scratch account
//   node 72-disable-master.js
//
// Never run this against the course's ISSUER: the lessons keep its master key
// so every script stays simple. This creates a throwaway account (20 XAH from
// the TREASURY) and shows the three steps:
//   1. Disabling the master key with no other way to sign is refused.
//   2. With a signer list in place, it is accepted.
//   3. From then on, the master key can't sign anything.
//
// Run first (from examples/):
//   node 01-create-accounts.js
const { Wallet, xahToDrops } = require("xahau");
const { connect, wallet, submit } = require("./lib/xahau");

const asfDisableMaster = 4;

async function main() {
  const client = await connect();
  const scratch = Wallet.generate("ecdsa-secp256k1");
  const signer = Wallet.generate("ecdsa-secp256k1"); // a signer needs no account of its own
  await submit(client, wallet("TREASURY_SEED"), {
    TransactionType: "Payment", Destination: scratch.address, Amount: xahToDrops(20),
  }, "create a scratch account");

  // 1. No regular key and no signer list: the ledger won't let the account lock itself out
  await submit(client, scratch, { TransactionType: "AccountSet", SetFlag: asfDisableMaster },
    "disable master, no regular key/signer list");

  // 2. Give it another way to sign first: here a 1-of-1 signer list
  await submit(client, scratch, {
    TransactionType: "SignerListSet",
    SignerQuorum: 1,
    SignerEntries: [{ SignerEntry: { Account: signer.address, SignerWeight: 1 } }],
  }, "signer list 1-of-1");
  await submit(client, scratch, { TransactionType: "AccountSet", SetFlag: asfDisableMaster },
    "disable master, with signer list");

  // 3. Anything signed with the master key is now rejected before it reaches a ledger
  const prepared = await client.autofill({ TransactionType: "AccountSet", Account: scratch.address });
  const { result } = await client.submit(scratch.sign(prepared).tx_blob);
  console.log(`  master key after disabling → ${result.engine_result}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

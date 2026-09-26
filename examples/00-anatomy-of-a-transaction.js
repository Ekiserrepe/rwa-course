// 00-anatomy-of-a-transaction.js: one Payment, followed step by step
//   node 00-anatomy-of-a-transaction.js
// ALICE sends 1 XAH to TREASURY. Every stage is printed so you can see what
// you write, what the library adds, what signing produces and what the
// network answers.
//
// Run first (from examples/):
//   node 01-create-accounts.js
const { xahToDrops } = require("xahau");
const { connect, wallet } = require("./lib/xahau");

async function main() {
  const client = await connect();
  const sender = wallet("ALICE_SEED");

  // 1. What you write: the intent
  const tx = {
    TransactionType: "Payment",
    Account: sender.address,
    Destination: wallet("TREASURY_SEED").address,
    Amount: xahToDrops(1), // amounts of XAH travel in drops: 1 XAH = 1,000,000 drops
  };
  console.log("1. You write:\n", tx);

  // 2. What autofill adds: the bookkeeping every transaction needs
  const prepared = await client.autofill(tx);
  const { Fee, Sequence, LastLedgerSequence, NetworkID } = prepared;
  console.log("\n2. autofill adds:", { Fee, Sequence, LastLedgerSequence, NetworkID });

  // 3. Signing: proof the account holder approved exactly these fields
  const { tx_blob, hash } = sender.sign(prepared);
  console.log(`\n3. Signed. Hash (the transaction's ID): ${hash}`);
  console.log(`   Blob sent to the network: ${tx_blob.slice(0, 48)}… (${tx_blob.length / 2} bytes)`);

  // 4. Submit and wait until a ledger includes it
  const res = await client.submitAndWait(tx_blob);
  console.log(`\n4. Result: ${res.result.meta.TransactionResult} in ledger ${res.result.ledger_index ?? res.result.tx_json?.ledger_index}`);

  // 5. Anyone can look it up later by its hash
  const again = await client.request({ command: "tx", transaction: hash });
  console.log(`5. Looked up again by hash: validated = ${again.result.validated}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

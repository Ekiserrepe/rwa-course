// 25-deposit-auth.js: an account that accepts payments only from approved senders
//   node 25-deposit-auth.js
//
// TREASURY turns on DepositAuth and preauthorises ALICE. Then ALICE and BOB
// each try to send it 1 HBOND: only ALICE gets through. Finally the setting is
// turned off again so later lessons are not affected.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 20-onboard-investor.js ALICE --approve
//   node 20-onboard-investor.js BOB --approve
//   node 21-transfer.js TREASURY ALICE 500
//   node 21-transfer.js TREASURY BOB 300
const { connect, wallet, submit, bond } = require("./lib/xahau");

const asfDepositAuth = 9;

async function main() {
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");
  const alice = wallet("ALICE_SEED");
  const bob = wallet("BOB_SEED");

  await submit(client, treasury, { TransactionType: "AccountSet", SetFlag: asfDepositAuth }, "treasury: DepositAuth on");
  await submit(client, treasury, { TransactionType: "DepositPreauth", Authorize: alice.address }, "treasury: preauthorise alice");

  const pay = (who, name) =>
    submit(client, who, { TransactionType: "Payment", Destination: treasury.address, Amount: bond(1) }, `${name} -> treasury: 1 HBOND`);
  await pay(alice, "alice");
  await pay(bob, "bob");

  // Clean up
  await submit(client, treasury, { TransactionType: "DepositPreauth", Unauthorize: alice.address }, "treasury: remove preauth");
  await submit(client, treasury, { TransactionType: "AccountSet", ClearFlag: asfDepositAuth }, "treasury: DepositAuth off");
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

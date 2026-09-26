// 13-issue-supply.js: create the token supply by paying it to the TREASURY
//   node 13-issue-supply.js [amount=10000]
//
// There is no "mint" for fungible tokens: an issuer creates them by paying
// them out, and destroys them when they are paid back.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
const { connect, wallet, submit, trustLine, BOND_CODE, bond } = require("./lib/xahau");

async function main() {
  const amount = process.argv[2] ?? "10000";
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  const treasury = wallet("TREASURY_SEED");

  await submit(client, issuer, {
    TransactionType: "Payment",
    Destination: treasury.address,
    Amount: bond(amount),
  }, `issue ${amount} HBOND to treasury`);

  const line = await trustLine(client, treasury.address, issuer.address, BOND_CODE);
  console.log(`Treasury holds ${line.balance} HBOND`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

// 30-stablecoin-setup.js: a USD stablecoin for investors to pay with
//   node 30-stablecoin-setup.js
//
// STABLE plays a regulated stablecoin issuer. It is set up the simple way:
// DefaultRipple on, no RequireAuth, so anyone may hold it. The TREASURY and
// the investors open USD trust lines, and STABLE pays each investor 10,000 USD,
// as if they had wired dollars to it.
//
// Run first (from examples/):
//   node 01-create-accounts.js
const { connect, wallet, submit, trustLine, usd } = require("./lib/xahau");

async function main() {
  const client = await connect();
  const stable = wallet("STABLE_SEED");

  await submit(client, stable, { TransactionType: "AccountSet", SetFlag: 8 }, "stable: asfDefaultRipple");

  for (const role of ["TREASURY", "ALICE", "BOB", "CAROL"]) {
    await submit(client, wallet(`${role}_SEED`), { TransactionType: "TrustSet", LimitAmount: usd(10_000_000) }, `${role.toLowerCase()}: USD trust line`);
  }
  for (const role of ["ALICE", "BOB", "CAROL"]) {
    await submit(client, stable, { TransactionType: "Payment", Destination: wallet(`${role}_SEED`).address, Amount: usd(10_000) }, `stable -> ${role.toLowerCase()}: 10,000 USD`);
  }
  for (const role of ["ALICE", "BOB", "CAROL"]) {
    const line = await trustLine(client, wallet(`${role}_SEED`).address, stable.address, "USD");
    console.log(`  ${role}: ${line.balance} USD`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

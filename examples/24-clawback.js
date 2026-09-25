// 24-clawback.js: the issuer takes tokens back from a holder
//   node 24-clawback.js <ROLE> <amount>
//
// Works only if the issuer set asfAllowTrustLineClawback before it had any
// trust lines (10-issuer-setup.js). The clawed-back tokens are destroyed:
// supply shrinks. To hand them to someone else, issue them again.
const { connect, wallet, submit, trustLine, BOND_CODE } = require("./lib/xahau");

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  const amount = process.argv[3];
  if (!role || !(Number(amount) > 0)) throw new Error("Usage: 24-clawback.js <ROLE> <amount>");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  const holder = wallet(`${role}_SEED`).address;

  const before = await trustLine(client, holder, issuer.address, BOND_CODE);
  await submit(client, issuer, {
    TransactionType: "Clawback",
    // Careful: here "issuer" holds the HOLDER's address, the account to claw from
    Amount: { currency: BOND_CODE, issuer: holder, value: String(amount) },
  }, `claw back ${amount} HBOND from ${role.toLowerCase()}`);
  const after = await trustLine(client, holder, issuer.address, BOND_CODE);
  console.log(`  ${role}: ${before.balance} -> ${after.balance} HBOND`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

// 20-onboard-investor.js: an investor asks to hold HBOND, the issuer decides
//   node 20-onboard-investor.js <ALICE|BOB|CAROL> [--approve]
//
// Step 1 always runs: the investor opens a trust line (a request).
// Step 2 runs only with --approve: the issuer authorises it, after KYC.
const { connect, wallet, submit, trustLine, BOND_CODE, bond } = require("./lib/xahau");

const tfSetfAuth = 0x00010000;

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  if (!["ALICE", "BOB", "CAROL"].includes(role)) throw new Error("Usage: 20-onboard-investor.js <ALICE|BOB|CAROL> [--approve]");
  const approve = process.argv.includes("--approve");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  const investor = wallet(`${role}_SEED`);

  const existing = await trustLine(client, investor.address, issuer.address, BOND_CODE);
  if (!existing) {
    await submit(client, investor, { TransactionType: "TrustSet", LimitAmount: bond(100_000) }, `${role.toLowerCase()}: request a trust line`);
  }

  if (approve) {
    // In production this line runs only after your KYC provider says yes
    await submit(client, issuer, {
      TransactionType: "TrustSet",
      LimitAmount: { currency: BOND_CODE, issuer: investor.address, value: "0" },
      Flags: tfSetfAuth,
    }, `issuer: authorise ${role.toLowerCase()}`);
  }

  const line = await trustLine(client, investor.address, issuer.address, BOND_CODE);
  console.log(`${role}: trust line limit ${line.limit}, balance ${line.balance}, authorised: ${!!line.peer_authorized}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

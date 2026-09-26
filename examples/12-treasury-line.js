// 12-treasury-line.js: the TREASURY opens a trust line and the ISSUER approves it
//   node 12-treasury-line.js
//
// With RequireAuth on, a trust line exists in two steps: the holder asks
// (TrustSet with a limit), then the issuer authorises (TrustSet with tfSetfAuth).
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
const { connect, wallet, submit, trustLine, BOND_CODE, bond } = require("./lib/xahau");

const tfSetfAuth = 0x00010000;

async function main() {
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  const treasury = wallet("TREASURY_SEED");

  // 1. The holder's side: "I accept up to 1,000,000 HBOND from this issuer"
  await submit(client, treasury, { TransactionType: "TrustSet", LimitAmount: bond(1_000_000) }, "treasury: trust line");

  // 2. The issuer's side: authorise that line. The limit is 0: the issuer
  //    does not want to hold its own token, it only approves the holder.
  await submit(client, issuer, {
    TransactionType: "TrustSet",
    LimitAmount: { currency: BOND_CODE, issuer: treasury.address, value: "0" },
    Flags: tfSetfAuth,
  }, "issuer: authorise treasury");

  const line = await trustLine(client, treasury.address, issuer.address, BOND_CODE);
  console.log(`\nTreasury line: limit ${line.limit}, balance ${line.balance}, authorised by issuer: ${!!line.peer_authorized}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

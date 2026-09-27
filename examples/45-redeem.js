// 45-redeem.js: a holder redeems all its HBOND into the redemption window
//   node 45-redeem.js <ROLE> [faceValueUSD=100]
//
// tfFillOrKill: the whole balance at face value, or nothing. The tokens and
// the principal cross in one transaction, so the holder can never end up
// without both.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 20-onboard-investor.js ALICE --approve
//   node 20-onboard-investor.js BOB --approve
//   node 30-stablecoin-setup.js
//   node 31-primary-offer.js 5000 100
//   node 33-subscribe.js ALICE 20
//   node 33-subscribe.js BOB 30 100
//   node 44-redemption-window.js
const { connect, wallet, submit, trustLine, bond, usd, dec, BOND_CODE } = require("./lib/xahau");

const tfFillOrKill = 0x00040000;

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  const face = dec(process.argv[3] ?? 100);
  if (!role) throw new Error("Usage: 45-redeem.js <ROLE> [faceValueUSD]");
  const client = await connect();
  const holder = wallet(`${role}_SEED`);
  const issuer = wallet("ISSUER_SEED").address;

  const units = dec((await trustLine(client, holder.address, issuer, BOND_CODE))?.balance ?? 0);
  if (units.lte(0)) throw new Error(`${role} holds no HBOND`);
  const principal = units.times(face);

  await submit(client, holder, {
    TransactionType: "OfferCreate",
    TakerGets: bond(units),           // what the holder gives
    TakerPays: usd(principal),        // the least it accepts
    Flags: tfFillOrKill,
  }, `${role.toLowerCase()}: redeem ${units} HBOND for ${principal} USD`);

  const h = await trustLine(client, holder.address, issuer, BOND_CODE);
  const u = await trustLine(client, holder.address, usd(0).issuer, "USD");
  console.log(`  ${role}: ${h.balance} HBOND, ${u.balance} USD`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

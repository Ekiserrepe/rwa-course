// 33-subscribe.js: an investor buys HBOND from the book with USD
//   node 33-subscribe.js <ROLE> <amount> [maxPriceUSD=101]
//
// tfFillOrKill: the whole amount at or under the price cap, or nothing.
// Payment and delivery happen in the same transaction (delivery versus
// payment): nobody can end up having paid without receiving, or the reverse.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 20-onboard-investor.js ALICE --approve  (the buyer)
//   node 30-stablecoin-setup.js
//   node 31-primary-offer.js 5000 100
const { connect, wallet, submit, trustLine, bond, usd, BOND_CODE } = require("./lib/xahau");

const tfFillOrKill = 0x00040000;

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  const amount = Number(process.argv[3]);
  const maxPrice = Number(process.argv[4] ?? 101);
  if (!role || !(amount > 0)) throw new Error("Usage: 33-subscribe.js <ROLE> <amount> [maxPriceUSD]");
  const client = await connect();
  const investor = wallet(`${role}_SEED`);

  await submit(client, investor, {
    TransactionType: "OfferCreate",
    TakerPays: bond(amount),              // what the investor wants
    TakerGets: usd(amount * maxPrice),    // the most it will pay
    Flags: tfFillOrKill,
  }, `${role.toLowerCase()}: buy ${amount} HBOND at ≤ ${maxPrice} USD`);

  const h = await trustLine(client, investor.address, bond(0).issuer, BOND_CODE);
  const u = await trustLine(client, investor.address, usd(0).issuer, "USD");
  console.log(`  ${role} now holds ${h?.balance ?? 0} HBOND and ${u?.balance ?? 0} USD`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

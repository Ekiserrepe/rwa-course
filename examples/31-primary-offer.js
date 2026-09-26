// 31-primary-offer.js: the TREASURY offers the bond to the market
//   node 31-primary-offer.js [amount=5000] [priceUSD=100]
//
// One OfferCreate is the whole primary sale: "I give <amount> HBOND and want
// <amount × price> USD". It rests on the order book until investors fill it.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 30-stablecoin-setup.js
const { connect, wallet, submit, bond, usd } = require("./lib/xahau");

async function main() {
  const amount = Number(process.argv[2] ?? 5000);
  const price = Number(process.argv[3] ?? 100);
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");

  const { meta } = await submit(client, treasury, {
    TransactionType: "OfferCreate",
    TakerGets: bond(amount),          // what the treasury gives
    TakerPays: usd(amount * price),   // what it wants in return
  }, `offer ${amount} HBOND at ${price} USD`);

  const offer = meta.AffectedNodes.find((n) => n.CreatedNode?.LedgerEntryType === "Offer")?.CreatedNode;
  if (offer) console.log(`  Offer ${offer.LedgerIndex} (sequence ${offer.NewFields.Sequence}) is on the book`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

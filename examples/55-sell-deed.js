// 55-sell-deed.js: the SPV sells the warehouse deed to BOB for USD
//   node 55-sell-deed.js <URITokenID> [priceUSD=1000]
//
// A sell offer reserved for one buyer (Destination), priced in the USD
// stablecoin, then BOB's purchase. Payment and transfer of the deed happen in
// the same transaction: there is no moment where one side has both.
// The default price is scaled down so BOB's test USD covers it.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 30-stablecoin-setup.js
//   node 51-mint-deed.js  (it prints the URITokenID to pass here)
const { connect, wallet, submit, usd, getObject } = require("./lib/xahau");

async function main() {
  const [id, price = "1000"] = process.argv.slice(2);
  if (!/^[0-9A-F]{64}$/i.test(id ?? "")) throw new Error("Usage: 55-sell-deed.js <URITokenID> [priceUSD]");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  const bob = wallet("BOB_SEED");

  await submit(client, issuer, {
    TransactionType: "URITokenCreateSellOffer",
    URITokenID: id,
    Amount: usd(price),
    Destination: bob.address, // nobody else can buy it
  }, `offer the deed to bob for ${price} USD`);

  // Reading the offer back before paying is what a careful buyer does
  const offer = await getObject(client, id);
  console.log(`  listed at ${offer.Amount.value} ${offer.Amount.currency}, only for ${offer.Destination}`);
  await submit(client, bob, { TransactionType: "URITokenBuy", URITokenID: id, Amount: offer.Amount }, "bob buys the deed");

  const after = await getObject(client, id);
  console.log(`  owner is now ${after.Owner === bob.address ? "BOB" : after.Owner}, issuer still ${after.Issuer}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

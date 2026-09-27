// 60-publish-nav.js: publish the bond's NAV (net asset value) as an on-ledger price oracle
//   node 60-publish-nav.js [navUSD=100.37]
//
// OracleSet creates or updates an Oracle object owned by the publisher, here
// the ISSUER acting as its own fund administrator. Prices are integers with a
// Scale: 100.37 is AssetPrice 10037, Scale 2.
//
// Run first (from examples/):
//   node 01-create-accounts.js
const { connect, wallet, submit, toHex, dec, BOND_CODE } = require("./lib/xahau");

const DOCUMENT_ID = 1; // one publisher can own several oracles, told apart by this

function toScaled(price) {
  const [, decimals = ""] = String(price).split(".");
  const Scale = decimals.length;
  return { AssetPrice: dec(price).shiftedBy(Scale).toString(16), Scale };
}

async function main() {
  const nav = process.argv[2] ?? "100.37";
  const client = await connect();
  const publisher = wallet("ISSUER_SEED");

  await submit(client, publisher, {
    TransactionType: "OracleSet",
    OracleDocumentID: DOCUMENT_ID,
    Provider: toHex("harbor-bond-administrator"),  // fixed at creation
    AssetClass: toHex("bond"),                     // fixed at creation
    URI: toHex("https://harbor-bond.example/nav"),
    LastUpdateTime: Math.floor(Date.now() / 1000), // Unix time, within 300 s of the ledger's close time
    PriceDataSeries: [{
      PriceData: { BaseAsset: BOND_CODE, QuoteAsset: "USD", ...toScaled(nav) },
    }],
  }, `publish NAV ${nav} USD`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

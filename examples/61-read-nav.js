// 61-read-nav.js: read a published NAV, and refuse it if it is stale
//   node 61-read-nav.js [rPublisher] [maxAgeSeconds=86400]
const { connect, wallet, currencyName } = require("./lib/xahau");

async function main() {
  const publisher = process.argv[2] || wallet("ISSUER_SEED").address;
  const maxAge = Number(process.argv[3] ?? 86400);
  const client = await connect();

  const { node } = (await client.request({
    command: "ledger_entry",
    oracle: { account: publisher, oracle_document_id: 1 },
    ledger_index: "validated",
  })).result;

  const age = Math.floor(Date.now() / 1000) - node.LastUpdateTime;
  console.log(`Oracle of ${publisher}`);
  console.log(`  provider: ${Buffer.from(node.Provider, "hex").toString()}, class: ${Buffer.from(node.AssetClass, "hex").toString()}`);
  console.log(`  updated ${age}s ago (${new Date(node.LastUpdateTime * 1000).toISOString()})`);
  for (const { PriceData: p } of node.PriceDataSeries) {
    const price = parseInt(p.AssetPrice, 16) / 10 ** (p.Scale ?? 0);
    console.log(`  ${currencyName(p.BaseAsset)}/${currencyName(p.QuoteAsset)} = ${price}`);
  }
  // The same through get_aggregate_price, built for combining several
  // independent oracles (median, mean, spread). With one oracle: that price.
  const agg = (await client.request({
    command: "get_aggregate_price",
    base_asset: node.PriceDataSeries[0].PriceData.BaseAsset,
    quote_asset: "USD",
    oracles: [{ account: publisher, oracle_document_id: 1 }],
  })).result;
  console.log(`  aggregate of ${agg.entire_set.size} oracle(s): median ${agg.median}`);

  if (age > maxAge) {
    console.log(`  ✘ STALE: older than ${maxAge}s, do not price anything with it`);
    process.exitCode = 2;
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.data?.error ?? err.message);
  process.exit(1);
});

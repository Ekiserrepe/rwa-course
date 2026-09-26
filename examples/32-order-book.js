// 32-order-book.js: every open offer to sell HBOND for USD, best price first
//   node 32-order-book.js
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 30-stablecoin-setup.js
//   node 31-primary-offer.js 5000 100
const { connect, wallet, bond, usd } = require("./lib/xahau");

async function main() {
  const client = await connect();
  const names = Object.fromEntries(
    ["TREASURY", "ALICE", "BOB", "CAROL"].map((r) => [wallet(`${r}_SEED`).address, r]),
  );

  const { offers } = (await client.request({
    command: "book_offers",
    taker_gets: { currency: bond(0).currency, issuer: bond(0).issuer }, // what a buyer receives
    taker_pays: { currency: "USD", issuer: usd(0).issuer },             // what a buyer pays
    limit: 20,
  })).result;

  if (!offers.length) console.log("The book is empty.");
  for (const o of offers) {
    // quality = TakerPays / TakerGets = USD per HBOND
    const left = o.taker_gets_funded?.value ?? o.TakerGets.value;
    console.log(`  ${Number(o.quality).toFixed(2)} USD  x ${left} HBOND  from ${names[o.Account] ?? o.Account}`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

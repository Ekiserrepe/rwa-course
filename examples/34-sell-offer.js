// 34-sell-offer.js: a holder offers HBOND on the secondary market
//   node 34-sell-offer.js <ROLE> <amount> <priceUSD>
//   node 34-sell-offer.js <ROLE> --cancel <OfferSequence>
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
const { connect, wallet, submit, bond, usd, dec } = require("./lib/xahau");

async function main() {
  const [roleArg, a, b] = process.argv.slice(2);
  const role = (roleArg ?? "").toUpperCase();
  if (!role) throw new Error("Usage: 34-sell-offer.js <ROLE> <amount> <priceUSD> | <ROLE> --cancel <seq>");
  const client = await connect();
  const seller = wallet(`${role}_SEED`);

  if (a === "--cancel") {
    await submit(client, seller, { TransactionType: "OfferCancel", OfferSequence: Number(b) }, `${role.toLowerCase()}: cancel offer ${b}`);
  } else {
    const { result } = await submit(client, seller, {
      TransactionType: "OfferCreate",
      TakerGets: bond(a),
      TakerPays: usd(dec(a).times(b)),
    }, `${role.toLowerCase()}: sell ${a} HBOND at ${b} USD`);
    console.log(`  Cancel it later with: node 34-sell-offer.js ${role} --cancel ${result.tx_json?.Sequence ?? result.Sequence}`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

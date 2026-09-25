// 34-sell-offer.js: a holder offers HBOND on the secondary market
//   node 34-sell-offer.js <ROLE> <amount> <priceUSD>
//   node 34-sell-offer.js <ROLE> --cancel <OfferSequence>
const { connect, wallet, submit, bond, usd } = require("./lib/xahau");

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
      TakerPays: usd(Number(a) * Number(b)),
    }, `${role.toLowerCase()}: sell ${a} HBOND at ${b} USD`);
    console.log(`  Cancel it later with: node 34-sell-offer.js ${role} --cancel ${result.tx_json?.Sequence ?? result.Sequence}`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

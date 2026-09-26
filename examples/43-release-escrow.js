// 43-release-escrow.js: release the coupon reserve once its time has come
//   node 43-release-escrow.js <OfferSequence>
//
// Anyone may submit EscrowFinish; the funds go to the escrow's Destination
// (here the treasury itself). Too early gives tecNO_PERMISSION and changes nothing.
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
//   node 42-coupon-reserve.js  (it prints the number to pass here)
const { connect, wallet, submit, usd } = require("./lib/xahau");

async function main() {
  const seq = Number(process.argv[2]);
  if (!Number.isInteger(seq)) throw new Error("Usage: 43-release-escrow.js <OfferSequence>");
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");

  await submit(client, treasury, {
    TransactionType: "EscrowFinish",
    Owner: treasury.address, // who created the escrow
    OfferSequence: seq,      // the Sequence of its EscrowCreate
  }, `release escrow ${seq}`);

  const line = (await client.request({ command: "account_lines", account: treasury.address, peer: usd(0).issuer })).result.lines[0];
  console.log(`  treasury USD: balance ${line.balance}, of which locked ${line.locked_balance ?? 0}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

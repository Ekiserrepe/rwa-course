// 43-release-escrow.js: release the coupon reserve once its time has come
//   node 43-release-escrow.js <OfferSequence>
//
// Anyone may submit EscrowFinish; the funds go to the escrow's Destination
// (here the treasury itself). Too early gives tecNO_PERMISSION and changes nothing.
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

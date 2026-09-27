// 42-coupon-reserve.js: lock next quarter's coupon money until payment day
//   node 42-coupon-reserve.js [amountUSD=1000] [seconds=60]
//
// The TREASURY escrows USD to itself: the money is visibly set aside and
// cannot be spent on anything else before FinishAfter. Investors can check it
// on the ledger instead of taking the issuer's word for it.
//
// First, it tries the same with HBOND to show the catch: Xahau refuses to
// lock a token whose issuer has clawback enabled (tecNO_PERMISSION).
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
const { connect, wallet, submit, bond, usd } = require("./lib/xahau");

const RIPPLE_EPOCH = 946684800; // ledger time counts seconds from 2000-01-01

async function main() {
  const amount = process.argv[2] ?? "1000";
  const seconds = Number(process.argv[3] ?? 60);
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");
  const now = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH;
  const times = { FinishAfter: now + seconds, CancelAfter: now + 30 * 24 * 3600 };

  // 1. The catch: HBOND's issuer can claw back, so HBOND cannot be locked
  await submit(client, treasury, {
    TransactionType: "EscrowCreate", Destination: wallet("BOB_SEED").address, Amount: bond(10), ...times,
  }, "escrow 10 HBOND (issuer has clawback)", { expect: ["tecNO_PERMISSION"] });

  // 2. USD can: its issuer never enabled clawback
  const { result, code } = await submit(client, treasury, {
    TransactionType: "EscrowCreate",
    Destination: treasury.address, // to itself: a reserve, not a payment
    Amount: usd(amount),
    ...times,
  }, `reserve ${amount} USD for ${seconds}s`);

  const line = (await client.request({ command: "account_lines", account: treasury.address, peer: usd(0).issuer })).result.lines[0];
  console.log(`  treasury USD: balance ${line.balance}, of which locked ${line.locked_balance ?? 0}`);
  if (code === "tesSUCCESS") {
    const seq = result.tx_json?.Sequence ?? result.Sequence;
    console.log(`  release after ${new Date((times.FinishAfter + RIPPLE_EPOCH) * 1000).toISOString()} with: node 43-release-escrow.js ${seq}`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

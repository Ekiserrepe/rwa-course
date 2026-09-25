// 41-pay-coupon.js: pay every holder in the snapshot their coupon in USD
//   node 41-pay-coupon.js <USDperHBOND> [--dry-run]
//   node 41-pay-coupon.js 1.25        (5% a year on 100 USD face, paid quarterly)
//
// Resumable: each payment carries a memo with the record ledger, and holders
// already paid for that ledger are skipped. Run it again after a crash and
// nobody is paid twice.
const fs = require("fs");
const { connect, wallet, submit, usd, toHex, fromHex } = require("./lib/xahau");

async function alreadyPaid(client, payer, recordLedger) {
  const paid = new Set();
  const tag = `coupon:${recordLedger}`;
  let marker;
  do {
    const res = (await client.request({ command: "account_tx", account: payer, limit: 200, marker })).result;
    for (const { tx, meta } of res.transactions) {
      if (tx.TransactionType !== "Payment" || tx.Account !== payer || meta.TransactionResult !== "tesSUCCESS") continue;
      if ((tx.Memos ?? []).some((m) => fromHex(m.Memo.MemoData ?? "") === tag)) paid.add(tx.Destination);
    }
    marker = res.marker;
  } while (marker);
  return paid;
}

async function main() {
  const perUnit = Number(process.argv[2]);
  const dryRun = process.argv.includes("--dry-run");
  if (!(perUnit > 0)) throw new Error("Usage: 41-pay-coupon.js <USDperHBOND> [--dry-run]");
  if (!fs.existsSync("snapshot.json")) throw new Error("Run 40-holder-snapshot.js --save first");
  const { ledger, holders } = JSON.parse(fs.readFileSync("snapshot.json", "utf8"));

  const client = await connect();
  const payer = wallet("TREASURY_SEED");
  const done = await alreadyPaid(client, payer.address, ledger);

  let total = 0;
  for (const h of holders) {
    // Round down to the cent: never pay out more than the coupon promises
    const amount = Math.floor(h.balance * perUnit * 100) / 100;
    if (done.has(h.account)) { console.log(`  = ${h.account} already paid for ledger ${ledger}`); continue; }
    if (h.frozen) { console.log(`  ! ${h.account} is frozen: coupon held back, pay it when released`); continue; }
    if (dryRun) { console.log(`  would pay ${h.account} ${amount} USD`); continue; }
    const { code } = await submit(client, payer, {
      TransactionType: "Payment",
      Destination: h.account,
      Amount: usd(amount),
      Memos: [{ Memo: { MemoType: toHex("coupon"), MemoData: toHex(`coupon:${ledger}`) } }],
    }, `coupon ${amount} USD -> ${h.account}`);
    if (code === "tesSUCCESS") total += amount;
  }
  console.log(`Paid ${total} USD this run.`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

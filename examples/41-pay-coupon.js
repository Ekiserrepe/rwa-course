// 41-pay-coupon.js: pay every holder in the snapshot their coupon in USD
//   node 41-pay-coupon.js <USDperHBOND> [--dry-run]
//   node 41-pay-coupon.js 1.25        (5% a year on 100 USD face, paid quarterly)
//
// Resumable: each payment carries a memo with the record ledger, and holders
// already paid for that ledger are skipped. A payment can also be in flight
// when the script stops: sent, but not yet validated, so not yet in the
// history. So before sending, the script writes the payment's hash and its
// LastLedgerSequence to coupon-journal.json. On a rerun, a journaled payment
// counts as paid if it validated, is retried only once its LastLedgerSequence
// has passed without it (it can never validate after that), and is otherwise
// left alone until it settles. Run it again after a crash and nobody is paid twice.
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
//   node 40-holder-snapshot.js --save
const fs = require("fs");
const path = require("path");

const SNAPSHOT = path.join(__dirname, "snapshot.json");
const JOURNAL = path.join(__dirname, "coupon-journal.json");
const { connect, wallet, submit, usd, toHex, fromHex, dec, ROUND_DOWN } = require("./lib/xahau");

/** Holders with a validated coupon payment for this record ledger. */
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

/** What became of a journaled payment: "paid", "failed" (safe to retry) or "pending". */
async function settle(client, { hash, lastLedger }) {
  try {
    const { validated, meta } = (await client.request({ command: "tx", transaction: hash })).result;
    if (validated) return meta.TransactionResult === "tesSUCCESS" ? "paid" : "failed";
  } catch (err) {
    if (err.data?.error !== "txnNotFound") throw err;
  }
  const current = (await client.request({ command: "ledger", ledger_index: "validated" })).result.ledger_index;
  return current > lastLedger ? "failed" : "pending";
}

async function main() {
  const perUnit = dec(process.argv[2] ?? NaN);
  const dryRun = process.argv.includes("--dry-run");
  if (!perUnit.gt(0)) throw new Error("Usage: 41-pay-coupon.js <USDperHBOND> [--dry-run]");
  if (!fs.existsSync(SNAPSHOT)) throw new Error("Run 40-holder-snapshot.js --save first");
  const { ledger, holders } = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
  const journal = fs.existsSync(JOURNAL) ? JSON.parse(fs.readFileSync(JOURNAL, "utf8")) : {};
  const sent = (journal[ledger] ??= {});
  const record = () => fs.writeFileSync(JOURNAL, JSON.stringify(journal, null, 2));

  const client = await connect();
  const payer = wallet("TREASURY_SEED");
  const done = await alreadyPaid(client, payer.address, ledger);

  let total = dec(0);
  for (const h of holders) {
    // Exact decimals, rounded down to the cent: never pay out more than the coupon promises
    const amount = dec(h.balance).times(perUnit).decimalPlaces(2, ROUND_DOWN).toFixed();
    if (done.has(h.account)) { console.log(`  = ${h.account} already paid for ledger ${ledger}`); continue; }
    if (sent[h.account]) {
      const state = await settle(client, sent[h.account]);
      if (state === "paid") { console.log(`  = ${h.account} already paid for ledger ${ledger}`); continue; }
      if (state === "pending") { console.log(`  … ${h.account} payment still in flight: run again in a few seconds`); continue; }
    }
    if (h.frozen) { console.log(`  ! ${h.account} is frozen: coupon held back, pay it when released`); continue; }
    if (dryRun) { console.log(`  would pay ${h.account} ${amount} USD`); continue; }
    const { code } = await submit(client, payer, {
      TransactionType: "Payment",
      Destination: h.account,
      Amount: usd(amount),
      Memos: [{ Memo: { MemoType: toHex("coupon"), MemoData: toHex(`coupon:${ledger}`) } }],
    }, `coupon ${amount} USD -> ${h.account}`, {
      // Journal first, send second: a crash after this line leaves a trace
      onSigned: ({ hash, LastLedgerSequence }) => { sent[h.account] = { hash, lastLedger: LastLedgerSequence }; record(); },
    });
    if (code === "tesSUCCESS") total = total.plus(amount);
  }
  console.log(`Paid ${total.toFixed()} USD this run.`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

// edge-cases.mjs: the failure paths the lessons describe, reproduced on testnet.
//
//   npm run verify:edge     (from examples/, right after `npm run verify`, on the same accounts)
//
// run-all.mjs checks every lesson's happy path. This script forces what should
// rarely happen and checks the code copes: coupon payments in flight, two
// subscriptions racing for the same stock, a desk delivery undercut by the DEX,
// a refund that fails too, every route out of the lockbox's vault, the holding
// cap's exemptions and resting bids, and a frozen holder at maturity.
// It spends only testnet XAH. Log: verify/edge-run.log; exit code = failed checks.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const EX = path.resolve(HERE, "..");
const LOG = path.join(HERE, "edge-run.log");
fs.writeFileSync(LOG, "");
const { connect, wallet, usd, bond, trustLine, toHex, dec, supply, BOND_CODE } = require("../lib/xahau");
const { hashes } = require("xahau");
const { accountBytes } = require("../hooks/lib");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (text) => fs.appendFileSync(LOG, text + "\n");
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  → " + detail}`);
  log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`);
}

/** Run a course script; returns its output and exit code. */
function sh(args, timeout = 240_000) {
  return new Promise((resolve) => {
    const p = spawn("node", args, { cwd: EX, env: process.env });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    const t = setTimeout(() => p.kill("SIGKILL"), timeout);
    p.on("close", (code) => { clearTimeout(t); log(`$ node ${args.join(" ")}\n${out}(exit ${code})`); resolve({ out, code }); });
  });
}

const client = await connect();
const W = Object.fromEntries(["ISSUER", "TREASURY", "ALICE", "BOB", "STABLE", "VAULT"].map((r) => [r, wallet(`${r}_SEED`)]));
const ISSUER = W.ISSUER.address;

/** Sign and submit, wait for validation; returns { code, ledger, hooks }. */
async function send(signer, tx, label) {
  const prepared = await client.autofill({ Account: signer.address, ...tx });
  const res = (await client.submitAndWait(signer.sign(prepared).tx_blob)).result;
  return report(label, res);
}
/** Several transactions from one account, signed with consecutive sequences and sent at once (same ledger). */
async function burst(signer, txs, labels) {
  const first = await client.autofill({ Account: signer.address, ...txs[0] });
  const prepared = [first];
  for (let i = 1; i < txs.length; i++) {
    prepared.push(await client.autofill({ Account: signer.address, ...txs[i], Sequence: first.Sequence + i, LastLedgerSequence: first.LastLedgerSequence }));
  }
  const res = await Promise.all(prepared.map((p) => client.submitAndWait(signer.sign(p).tx_blob)));
  return res.map((r, i) => report(labels[i], r.result));
}
function report(label, res) {
  const code = res.meta.TransactionResult;
  const hooks = (res.meta.HookExecutions ?? []).map((h) => Buffer.from(h.HookExecution.HookReturnString, "hex").toString().replace(/\0+$/, "")).filter(Boolean);
  const line = `${code === "tesSUCCESS" ? "✔" : "✘"} ${label}: ${code} (ledger ${res.ledger_index})${hooks.length ? "  [hook] " + hooks.join(" | ") : ""}`;
  console.log("   " + line);
  log(line);
  return { code, ledger: res.ledger_index, hooks: hooks.join(" | ") };
}
const hbond = async (who) => dec((await trustLine(client, W[who].address, ISSUER, BOND_CODE))?.balance ?? 0);
const cash = async (who) => dec((await trustLine(client, W[who].address, W.STABLE.address, "USD"))?.balance ?? 0);
const line = (who) => trustLine(client, W[who].address, ISSUER, BOND_CODE);
const ledgerNow = async () => (await client.request({ command: "ledger", ledger_index: "validated" })).result.ledger_index;
/** Wait until fn() is true, up to ~40 s (emitted transactions land a ledger or two later). */
async function until(fn) { for (let i = 0; i < 20; i++) { if (await fn()) return true; await sleep(2000); } return false; }
const namespace = (name) => crypto.createHash("sha256").update(name).digest("hex").toUpperCase();
async function hookState(account, name) {
  try {
    return (await client.request({ command: "account_namespace", account, namespace_id: namespace(name), ledger_index: "validated" })).result.namespace_entries ?? [];
  } catch { return []; }
}

// ── A. Setup: HBOND for the two investors ───────────────────────────────────
console.log("── setup");
await send(W.ISSUER, { TransactionType: "Payment", Destination: W.ALICE.address, Amount: bond(100) }, "issue 100 to alice");
await send(W.ISSUER, { TransactionType: "Payment", Destination: W.BOB.address, Amount: bond(100) }, "issue 100 to bob");

// ── B. Coupon journal ───────────────────────────────────────────────────────
console.log("── coupon journal");
const JOURNAL = path.join(EX, "coupon-journal.json");
fs.rmSync(JOURNAL, { force: true });
await sh(["40-holder-snapshot.js", "--save"]);
const snap = JSON.parse(fs.readFileSync(path.join(EX, "snapshot.json"), "utf8"));
const fakeHash = "AB".repeat(32);
// B1: a journaled payment that could still validate: left alone
fs.writeFileSync(JOURNAL, JSON.stringify({ [snap.ledger]: { [W.ALICE.address]: { hash: fakeHash, lastLedger: (await ledgerNow()) + 1000 } } }));
let x;
let r = await sh(["41-pay-coupon.js", "1"]);
check("journal: in-flight payment is not paid again", /\S+ payment still in flight/.test(r.out) && !new RegExp(`USD -> ${W.ALICE.address}: tesSUCCESS`).test(r.out) && /coupon [\d.]+ USD -> r\w+: tesSUCCESS/.test(r.out), r.out);
// B2: its LastLedgerSequence has passed: it can never validate, so it is paid now
const j = JSON.parse(fs.readFileSync(JOURNAL, "utf8"));
j[snap.ledger][W.ALICE.address] = { hash: fakeHash, lastLedger: (await ledgerNow()) - 1 };
fs.writeFileSync(JOURNAL, JSON.stringify(j));
r = await sh(["41-pay-coupon.js", "1"]);
check("journal: expired payment is retried", new RegExp(`USD -> ${W.ALICE.address}: tesSUCCESS`).test(r.out) && /already paid/.test(r.out), r.out);
// B3: a real crash: the payment is submitted, the script dies before validation, the rerun comes at once
await send(W.STABLE, { TransactionType: "Payment", Destination: W.ALICE.address, Amount: usd(1) }, "move a ledger");
await sh(["40-holder-snapshot.js", "--save"]);
const snap2 = JSON.parse(fs.readFileSync(path.join(EX, "snapshot.json"), "utf8"));
{
  const tx = await client.autofill({
    Account: W.TREASURY.address, TransactionType: "Payment", Destination: W.ALICE.address, Amount: usd(100),
    Memos: [{ Memo: { MemoType: toHex("coupon"), MemoData: toHex(`coupon:${snap2.ledger}`) } }],
  });
  const signed = W.TREASURY.sign(tx);
  const jj = JSON.parse(fs.readFileSync(JOURNAL, "utf8"));
  jj[snap2.ledger] = { [W.ALICE.address]: { hash: signed.hash, lastLedger: tx.LastLedgerSequence } };
  fs.writeFileSync(JOURNAL, JSON.stringify(jj));
  await client.submit(signed.tx_blob); // no waiting: the "crash"
}
const r1 = await sh(["41-pay-coupon.js", "1"]);
await sleep(8000);
const r2 = await sh(["41-pay-coupon.js", "1"]);
let paidAlice = 0;
for (const { tx, meta } of (await client.request({ command: "account_tx", account: W.TREASURY.address, limit: 50 })).result.transactions) {
  if (tx.Destination === W.ALICE.address && meta.TransactionResult === "tesSUCCESS" && (tx.Memos ?? []).some((m) => Buffer.from(m.Memo.MemoData ?? "", "hex").toString() === `coupon:${snap2.ledger}`)) paidAlice++;
}
check("journal: crash mid-payment, immediate rerun pays ALICE exactly once", paidAlice === 1 && /already paid/.test(r2.out), `payments=${paidAlice}\n${r1.out}\n${r2.out}`);

// ── C. Subscription desk ────────────────────────────────────────────────────
console.log("── subscription desk");
await sh(["hooks/install-subscription-desk.js", "100"]);
// C1: two subscriptions racing for 10 HBOND of stock, sent at the same moment
x = await send(W.ISSUER, { TransactionType: "Payment", Destination: W.TREASURY.address, Amount: bond(10) }, "stock: 10 HBOND to treasury");
check("desk: the issuer can restock the treasury while the desk is installed", x.code === "tesSUCCESS" && /token received/.test(x.hooks), `${x.code} ${x.hooks}`);
const [a0, b0] = [await hbond("ALICE"), await hbond("BOB")];
const pay = (who, amount) => client.autofill({ Account: W[who].address, TransactionType: "Payment", Destination: W.TREASURY.address, Amount: usd(amount) });
const [pa, pb] = await Promise.all([pay("ALICE", 1000), pay("BOB", 1000)]);
const [ra, rb] = (await Promise.all([client.submitAndWait(W.ALICE.sign(pa).tx_blob), client.submitAndWait(W.BOB.sign(pb).tx_blob)]))
  .map((x, i) => report(i ? "bob subscribes 1000 USD" : "alice subscribes 1000 USD", x.result));
await sleep(10_000);
const accepted = [ra, rb].filter((x) => x.code === "tesSUCCESS").length;
const refused = [ra, rb].find((x) => /not enough tokens left/.test(x.hooks));
const got = (await hbond("ALICE")).minus(a0).plus((await hbond("BOB")).minus(b0));
check(`desk: two subscriptions for 10 HBOND of stock, one delivered${ra.ledger === rb.ledger ? " (same ledger: the reservation decided)" : " (different ledgers)"}`,
  accepted === 1 && !!refused && got.eq(10) && (await hbond("TREASURY")).isZero(), `accepted=${accepted} delivered=${got}`);
check("desk: both subscriptions landed in the same ledger", ra.ledger === rb.ledger, `ledgers ${ra.ledger} / ${rb.ledger}`);

// C2: the treasury's resting DEX offer sells the stock before the delivery lands
await send(W.ISSUER, { TransactionType: "Payment", Destination: W.TREASURY.address, Amount: bond(10) }, "stock: 10 HBOND to treasury");
await send(W.TREASURY, { TransactionType: "OfferCreate", TakerGets: bond(10), TakerPays: usd(1000) }, "treasury offers the same 10 on the DEX");
const [ah, au] = [await hbond("ALICE"), await cash("ALICE")];
await burst(W.ALICE, [
  { TransactionType: "Payment", Destination: W.TREASURY.address, Amount: usd(1000) },
  { TransactionType: "OfferCreate", TakerPays: bond(10), TakerGets: usd(1000), Flags: 0x00040000 },
], ["alice pays the desk 1000 USD", "alice buys the 10 on the DEX, same ledger"]);
await until(async () => (await cash("ALICE")).eq(au.minus(1000)));
check("desk: stock sold on the DEX meanwhile → USD refunded", (await cash("ALICE")).eq(au.minus(1000)) && (await hbond("ALICE")).eq(ah.plus(10)),
  `USD ${au} -> ${await cash("ALICE")}, HBOND ${ah} -> ${await hbond("ALICE")}`);

// C3: the delivery fails AND the refund fails: the debt is recorded in state
await send(W.ISSUER, { TransactionType: "Payment", Destination: W.TREASURY.address, Amount: bond(10) }, "stock: 10 HBOND to treasury");
const [bh, bu] = [await hbond("ALICE"), await cash("ALICE")];
await burst(W.ALICE, [
  { TransactionType: "Payment", Destination: W.TREASURY.address, Amount: usd(500) },
  { TransactionType: "TrustSet", LimitAmount: usd(bu.minus(500)) },
  { TransactionType: "TrustSet", LimitAmount: bond(bh) },
], ["alice pays the desk 500 USD", "alice: USD limit = what she has left", "alice: HBOND limit = what she holds"]);
const aliceKey = accountBytes(W.ALICE.address);
const owed = await until(async () => (await hookState(W.TREASURY.address, "subscription_desk")).some((e) => e.HookStateKey.toUpperCase().includes(aliceKey)));
check("desk: refund impossible → amount owed recorded under the investor's account", owed && (await hbond("ALICE")).eq(bh) && (await cash("ALICE")).eq(bu.minus(500)),
  `owed entry=${owed}`);
r = await sh(["hooks/install-subscription-desk.js", "--remove"]);
check("desk: --remove refuses while the state holds a debt", r.code === 1 && /still settling/.test(r.out), r.out);
// Clean up: settle the debt by hand, clear the Hook's state, remove the desk
await send(W.ALICE, { TransactionType: "TrustSet", LimitAmount: usd(10_000_000) }, "alice: USD limit back");
await send(W.ALICE, { TransactionType: "TrustSet", LimitAmount: bond(1_000_000) }, "alice: HBOND limit back");
await send(W.TREASURY, { TransactionType: "Payment", Destination: W.ALICE.address, Amount: usd(500) }, "operations pay the 500 USD owed");
r = await sh(["hooks/install-subscription-desk.js", "--remove", "--clear-state"]);
check("desk: after the debt is paid, --clear-state clears the state and removes the desk",
  /✔ clear subscription_desk state/.test(r.out) && /✔ remove subscription_desk/.test(r.out) && (await hookState(W.TREASURY.address, "subscription_desk")).length === 0, r.out);

// ── D. Lockbox: every way out of the vault ──────────────────────────────────
console.log("── lockbox");
r = await sh(["hooks/lock-tokens.js", "ALICE", "BOB", "5", "3600"]);
const lockId = (r.out.match(/lock ([0-9A-F]{64})/) ?? [])[1];
check("lockbox: 5 HBOND locked in the vault", !!lockId && (await hbond("VAULT")).eq(5), r.out);
const V = W.VAULT;
const signer = wallet("CFO_SEED");
x = await send(V, { TransactionType: "AccountSet", Domain: toHex("vault.example") }, "vault: AccountSet");
check("lockbox: vault may AccountSet", x.code === "tesSUCCESS" && /key management/.test(x.hooks), x.hooks);
x = await send(V, { TransactionType: "SetRegularKey", RegularKey: signer.address }, "vault: SetRegularKey");
const y = await send(V, { TransactionType: "SetRegularKey" }, "vault: clear regular key");
check("lockbox: vault may SetRegularKey", x.code === "tesSUCCESS" && y.code === "tesSUCCESS");
x = await send(V, { TransactionType: "SignerListSet", SignerQuorum: 1, SignerEntries: [{ SignerEntry: { Account: signer.address, SignerWeight: 1 } }] }, "vault: SignerListSet");
const z = await send(V, { TransactionType: "SignerListSet", SignerQuorum: 0 }, "vault: delete signer list");
check("lockbox: vault may SignerListSet", x.code === "tesSUCCESS" && z.code === "tesSUCCESS");
const refusedOut = async (tx, label) => {
  const res = await send(V, tx, label);
  check(`lockbox: vault can't ${label}`, res.code === "tecHOOK_REJECTED" && /only through a release/.test(res.hooks), `${res.code} ${res.hooks}`);
};
await refusedOut({ TransactionType: "Remit", Destination: W.BOB.address, Amounts: [{ AmountEntry: { Amount: bond(1) } }] }, "Remit HBOND");
await refusedOut({ TransactionType: "CheckCreate", Destination: W.BOB.address, SendMax: bond(1) }, "CheckCreate HBOND");
await refusedOut({ TransactionType: "OfferCreate", TakerGets: bond(1), TakerPays: usd(1) }, "OfferCreate selling HBOND");
const uriText = `vault-test-${Date.now()}`;
const uri = toHex(uriText);
x = await send(W.BOB, { TransactionType: "URITokenMint", URI: uri, Amount: bond(1), Destination: V.address }, "bob mints a URIToken offered to the vault");
check("lockbox: a URIToken offered to the vault is refused (vault is its destination)", x.code === "tecHOOK_REJECTED", `${x.code} ${x.hooks}`);
await send(W.BOB, { TransactionType: "URITokenMint", URI: uri, Amount: bond(1) }, "bob mints a URIToken for sale to anyone, 1 HBOND");
await refusedOut({ TransactionType: "URITokenBuy", URITokenID: hashes.hashURIToken(W.BOB.address, uriText), Amount: bond(1) }, "URITokenBuy paid in HBOND");
x = await send(W.ALICE, { TransactionType: "Remit", Destination: V.address, Amounts: [{ AmountEntry: { Amount: bond(1) } }] }, "alice Remits HBOND into the vault");
check("lockbox: incoming Remit refused (only payments lock tokens)", x.code === "tecHOOK_REJECTED" && /only payments/.test(x.hooks), x.hooks);
check("lockbox: vault still holds exactly the locked 5", (await hbond("VAULT")).eq(5));
await sh(["24-clawback.js", "VAULT", "5"]);
r = await sh(["hooks/release-lock.js", "ISSUER", lockId, "--void"]);
check("lockbox: cleaned up (clawed back and voided)", /voided by the issuer/.test(r.out), r.out);

// ── E. Holding cap: exemptions and resting bids ─────────────────────────────
console.log("── holding cap");
await send(W.ISSUER, { TransactionType: "Payment", Destination: W.TREASURY.address, Amount: bond(200) }, "treasury gets 200 HBOND");
await sh(["hooks/install-holding-cap.js", "150"]);
x = await send(W.BOB, { TransactionType: "Payment", Destination: W.TREASURY.address, Amount: bond(1) }, "bob -> treasury 1 HBOND (treasury above the cap)");
await sleep(8000);
check("cap: the exempt treasury goes above MAX and is not frozen", x.code === "tesSUCCESS" && /within the limit/.test(x.hooks) && !(await line("TREASURY")).freeze_peer, x.hooks);
const bobBefore = await hbond("BOB");
const bid = await send(W.BOB, { TransactionType: "OfferCreate", TakerPays: bond(60), TakerGets: usd(6000) }, "bob rests a bid: 60 HBOND at 100 USD");
x = await send(W.ALICE, { TransactionType: "OfferCreate", TakerGets: bond(60), TakerPays: usd(6000), Flags: 0x00040000 }, "alice sells 60 into bob's bid");
await sleep(8000);
check("cap: the owner of a filled resting bid is frozen", bid.code === "tesSUCCESS" && x.code === "tesSUCCESS" && (await hbond("BOB")).gt(150) && !!(await line("BOB")).freeze_peer,
  `bob ${bobBefore} -> ${await hbond("BOB")}, hook: ${x.hooks}`);
await sh(["22-freeze.js", "BOB", "--off"]);
await sh(["hooks/install-holding-cap.js", "--remove"]);

// ── F. Two payments are not atomic (Module 5, lesson 4) ─────────────────────
console.log("── two-payment redemption");
x = await send(W.ALICE, { TransactionType: "Payment", Destination: ISSUER, Amount: bond(1) }, "alice: return 1 HBOND to the issuer");
const y2 = await send(W.TREASURY, { TransactionType: "Payment", Destination: W.ALICE.address, Amount: usd(1_000_000_000) }, "treasury: pay a principal it doesn't have");
check("two payments: the first succeeds, the second fails, the holder is left short", x.code === "tesSUCCESS" && y2.code === "tecPATH_PARTIAL");

// ── G. A frozen holder at maturity ──────────────────────────────────────────
console.log("── frozen holder at maturity");
await sh(["22-freeze.js", "BOB"]);
const due = (await supply(client, ISSUER, BOND_CODE, [W.TREASURY.address])).outside.times(100);
const short = due.minus(await cash("TREASURY"));
if (short.gt(0)) await send(W.STABLE, { TransactionType: "Payment", Destination: W.TREASURY.address, Amount: usd(short.plus(1)) }, "fund the principal");
const bobFrozen = await hbond("BOB");
r = await sh(["44-redemption-window.js"]);
const sized = dec((r.out.match(/buy ([\d.]+) HBOND/) ?? [])[1] ?? 0);
check("frozen: redemption window opens, sized with the frozen holding", /✔ redemption window/.test(r.out) && sized.gte(bobFrozen) && sized.eq(bobFrozen.plus(await hbond("ALICE"))), r.out);
r = await sh(["45-redeem.js", "BOB"]);
check("frozen: BOB can't sell into the window", r.code === 1 && /✘ bob: redeem/.test(r.out), r.out);
const units = await hbond("BOB");
const bobCash = await cash("BOB");
x = await send(W.TREASURY, { TransactionType: "Payment", Destination: W.BOB.address, Amount: usd(units.times(100)) }, `treasury pays bob's principal first: ${units.times(100)} USD`);
const cb = await send(W.ISSUER, { TransactionType: "Clawback", Amount: { currency: BOND_CODE, issuer: W.BOB.address, value: units.toFixed() } }, `issuer claws back bob's ${units} HBOND`);
check("frozen: paid first, then clawed back", x.code === "tesSUCCESS" && cb.code === "tesSUCCESS" && (await hbond("BOB")).isZero() && (await cash("BOB")).eq(bobCash.plus(units.times(100))));
await sh(["22-freeze.js", "BOB", "--off"]);
r = await sh(["45-redeem.js", "ALICE"]);
check("frozen: ALICE, not frozen, redeems normally", /✔ alice: redeem/.test(r.out), r.out);
// A frozen holder with tokens left: the supply is not zero, and 46 must say so
await send(W.ISSUER, { TransactionType: "Payment", Destination: W.BOB.address, Amount: bond(3) }, "issue 3 to bob");
await sh(["22-freeze.js", "BOB"]);
r = await sh(["46-retire-supply.js"]);
check("maturity: a frozen holder's 3 HBOND still count as in existence", /HBOND in existence: 3\b/.test(r.out), r.out);
await sh(["24-clawback.js", "BOB", "3"]);
await sh(["22-freeze.js", "BOB", "--off"]);
r = await sh(["46-retire-supply.js"]);
check("maturity: nothing left in existence", /HBOND in existence: 0\b/.test(r.out), r.out);
// The window's leftover USD bid: cancel it so later runs start clean
for (const o of (await client.request({ command: "account_offers", account: W.TREASURY.address, ledger_index: "validated" })).result.offers) {
  await send(W.TREASURY, { TransactionType: "OfferCancel", OfferSequence: o.seq }, `cancel leftover offer ${o.seq}`);
}

// ── H. Seed files readable by their owner only ──────────────────────────────
for (const f of [".env", ".env.bak", "capstone/accounts.json"]) {
  const p = path.join(EX, f);
  if (!fs.existsSync(p)) continue;
  const mode = fs.statSync(p).mode & 0o777;
  check(`files: ${f} is mode 600`, mode === 0o600, mode.toString(8));
}

await client.disconnect();
const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} edge checks passed. Log: verify/edge-run.log`);
process.exit(failed.length);

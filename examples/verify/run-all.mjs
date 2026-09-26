// run-all.mjs: run every course script against Xahau testnet and check that
// each one does what its lesson says.
//
//   npm run verify                      (from examples/: 6 fresh accounts, ~15 min)
//   npm run verify -- --reuse-accounts  (uses the accounts already in .env; they
//                                        must be fresh, the issuer setup only works once)
//
// It spends only testnet XAH. The log of every command and its output goes to
// verify/last-run.log; the exit code is the number of failed checks.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EX = path.resolve(HERE, "..");
const LOG = path.join(HERE, "last-run.log");
fs.writeFileSync(LOG, "");
const results = [];
const SKIP_ACCOUNTS = process.argv.includes("--reuse-accounts");

function sh(args, { timeout = 240_000 } = {}) {
  return new Promise((resolve) => {
    const p = spawn("node", args, { cwd: EX, env: process.env });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    const t = setTimeout(() => p.kill("SIGKILL"), timeout);
    p.on("close", (code) => { clearTimeout(t); resolve({ out, code }); });
  });
}

/** Run one script; pass when every regex matches and the exit code is right. */
async function step(name, args, expects = [], opts = {}) {
  const { out, code } = await sh(args, opts);
  fs.appendFileSync(LOG, `\n===== ${name}\n$ node ${args.join(" ")}\n${out}(exit ${code})\n`);
  const missing = expects.filter((re) => !re.test(out));
  const exitOk = code === (opts.exit ?? 0);
  const ok = missing.length === 0 && exitOk;
  results.push({ name, ok, why: ok ? "" : [...missing.map(String), exitOk ? "" : `exit ${code}`].filter(Boolean).join(" · ") });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  → " + results.at(-1).why}`);
  return out;
}

const grab = (out, re) => (out.match(re) ?? [])[1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Module 0 ────────────────────────────────────────────────────────────────
if (!SKIP_ACCOUNTS) {
  await step("m0 01-create-accounts", ["01-create-accounts.js"], [/ISSUER\s+r\w{24,}/, /STABLE\s+r\w{24,}/, /Saved to \.env/], { timeout: 900_000 });
}
await step("m0 00-wallet-basics", ["00-wallet-basics.js"], [/Balance:\s+1000 XAH/, /Spendable:\s+999 XAH/], { timeout: 600_000 });
await step("m0 00-anatomy-of-a-transaction", ["00-anatomy-of-a-transaction.js"], [/NetworkID: 21338/, /4\. Result: tesSUCCESS/, /validated = true/]);
await step("m0 00-look-around", ["00-look-around.js"], [/NetworkID 21338/, /reserves 1 \+ 0\.2 XAH/]);

// ── Module 2: issuing ───────────────────────────────────────────────────────
await step("m2 11-currency-code", ["11-currency-code.js"], [/HBOND\s+-> 48424F4E44000000000000000000000000000000/, /XAH\s+-> ✘ XAH is reserved/]);
await step("m2 10-issuer-setup", ["10-issuer-setup.js"], [/✔ asfAllowTrustLineClawback: tesSUCCESS/, /allowTrustLineClawback: true/, /requireAuthorization:\s+true/, /Domain:\s+harbor-bond\.example/]);
await step("m2 12-treasury-line", ["12-treasury-line.js"], [/authorised by issuer: true/]);
await step("m2 13-issue-supply", ["13-issue-supply.js"], [/Treasury holds 10000 HBOND/]);
await step("m2 14-supply-report", ["14-supply-report.js"], [/HBOND in the treasury:\s+10000/]);
await step("m2 15-issuer-profile", ["15-issuer-profile.js"], [/legal_name\s+Harbor Bond SPV Ltd\.\s+\(immutable\)/, /status\s+offering open/]);

// ── Module 3: compliance ────────────────────────────────────────────────────
await step("m3 20 onboard alice", ["20-onboard-investor.js", "ALICE", "--approve"], [/ALICE: .*authorised: true/]);
await step("m3 20 onboard bob", ["20-onboard-investor.js", "BOB", "--approve"], [/BOB: .*authorised: true/]);
await step("m3 20 carol requests only", ["20-onboard-investor.js", "CAROL"], [/CAROL: .*authorised: false/]);
await step("m3 21 treasury -> alice", ["21-transfer.js", "TREASURY", "ALICE", "500"], [/✔ .*tesSUCCESS/, /ALICE\s+500/]);
await step("m3 21 treasury -> bob", ["21-transfer.js", "TREASURY", "BOB", "300"], [/✔ .*tesSUCCESS/]);
await step("m3 21 treasury -> carol refused", ["21-transfer.js", "TREASURY", "CAROL", "10"], [/tecPATH_DRY/]);
await step("m3 21 alice -> bob", ["21-transfer.js", "ALICE", "BOB", "50"], [/✔ .*tesSUCCESS/]);
await step("m3 14 cap table", ["14-supply-report.js"], [/HBOND outside the treasury: 800/, /4 HBOND trust line\(s\)/]);
await step("m3 22 freeze alice", ["22-freeze.js", "ALICE"], [/frozen by issuer = true, deep = false/]);
await step("m3 21 frozen alice can't send", ["21-transfer.js", "ALICE", "BOB", "10"], [/tecPATH_DRY/]);
await step("m3 21 frozen alice can receive", ["21-transfer.js", "BOB", "ALICE", "10"], [/✔ .*tesSUCCESS/]);
await step("m3 22 deep-freeze alice", ["22-freeze.js", "ALICE", "--deep"], [/deep = true/]);
await step("m3 21 deep-frozen alice can't receive", ["21-transfer.js", "BOB", "ALICE", "10"], [/tecPATH_DRY/]);
await step("m3 22 unfreeze alice", ["22-freeze.js", "ALICE", "--off"], [/frozen by issuer = false, deep = false/]);
await step("m3 23 global freeze", ["23-global-freeze.js"], [/globalFreeze = true/]);
await step("m3 21 nothing moves", ["21-transfer.js", "ALICE", "BOB", "10"], [/tecPATH_DRY/]);
await step("m3 23 global freeze off", ["23-global-freeze.js", "--off"], [/globalFreeze = false/]);
await step("m3 24 clawback", ["24-clawback.js", "BOB", "50"], [/✔ claw back 50 HBOND from bob: tesSUCCESS/, /BOB: 340 -> 290 HBOND/]);
await step("m3 25 deposit auth", ["25-deposit-auth.js"], [/✔ alice -> treasury: 1 HBOND: tesSUCCESS/, /✘ bob -> treasury: 1 HBOND: tecNO_PERMISSION/]);

// ── Module 4: markets ───────────────────────────────────────────────────────
await step("m4 30 stablecoin", ["30-stablecoin-setup.js"], [/CAROL: 10000 USD/]);
await step("m4 31 primary offer", ["31-primary-offer.js", "5000", "100"], [/is on the book/]);
await step("m4 32 order book", ["32-order-book.js"], [/100\.00 USD\s+x 5000 HBOND\s+from TREASURY/]);
await step("m4 33 alice buys", ["33-subscribe.js", "ALICE", "20"], [/✔ .*tesSUCCESS/, /ALICE now holds 479 HBOND and 8000 USD/]);
await step("m4 33 bob buys", ["33-subscribe.js", "BOB", "30", "100"], [/✔ .*tesSUCCESS/]);
await step("m4 33 carol refused", ["33-subscribe.js", "CAROL", "1"], [/tecNO_AUTH/]);
await step("m4 33 price cap", ["33-subscribe.js", "ALICE", "5", "99"], [/tecKILLED/]);
const sell = await step("m4 34 alice asks 105", ["34-sell-offer.js", "ALICE", "10", "105"], [/✔ .*tesSUCCESS/]);
await step("m4 32 two offers", ["32-order-book.js"], [/100\.00 USD\s+x 4950 HBOND/, /105\.00 USD\s+x 10 HBOND\s+from ALICE/]);
await step("m4 34 cancel", ["34-sell-offer.js", "ALICE", "--cancel", grab(sell, /--cancel (\d+)/)], [/✔ .*tesSUCCESS/]);

// ── Module 5: servicing ─────────────────────────────────────────────────────
await step("m5 40 snapshot", ["40-holder-snapshot.js", "--save"], [/2 holder\(s\), 799 HBOND outside the treasury/, /Saved snapshot\.json/]);
await step("m5 41 dry run", ["41-pay-coupon.js", "1.25", "--dry-run"], [/would pay r\w+ 598\.75 USD/, /would pay r\w+ 400 USD/]);
await step("m5 41 pay", ["41-pay-coupon.js", "1.25"], [/Paid 998\.75 USD this run/]);
await step("m5 41 rerun pays nobody", ["41-pay-coupon.js", "1.25"], [/already paid/, /Paid 0 USD this run/]);
const reserve = await step("m5 42 reserve", ["42-coupon-reserve.js", "1000", "40"], [/✘ escrow 10 HBOND \(issuer has clawback\): tecNO_PERMISSION/, /✔ reserve 1000 USD for 40s: tesSUCCESS/, /of which locked 1000/]);
const seq = grab(reserve, /43-release-escrow\.js (\d+)/);
await step("m5 43 too early", ["43-release-escrow.js", seq], [/tecNO_PERMISSION/]);
await sleep(50_000);
await step("m5 43 released", ["43-release-escrow.js", seq], [/✔ release escrow \d+: tesSUCCESS/, /of which locked 0/]);

// ── Module 6: unique assets ─────────────────────────────────────────────────
await step("m6 50 digest", ["50-document-digest.js"], [/SHA-256: B0C11A612B810B1F567DDF86593739C6A85927781468ECF45D0A0FA517CBD980/]);
const mint = await step("m6 51 mint deed", ["51-mint-deed.js"], [/✔ mint the deed: tesSUCCESS/, /Digest: B0C11A61/]);
const deed = grab(mint, /URITokenID: ([0-9A-F]{64})/);
await step("m6 52 remarks", ["52-deed-remarks.js", deed], [/tecIMMUTABLE/, /parcel\s+PX-2291-0007\s+\(immutable\)/, /valuation\s+1185000 USD/]);
await step("m6 53 verify", ["53-verify-deed.js", deed], [/✔ Digest matches the document/]);
fs.writeFileSync(path.join(HERE, "tampered.txt"), fs.readFileSync(path.join(EX, "assets/warehouse-deed.txt"), "utf8").replace("1,150,000", "1,950,000"));
await step("m6 53 tampered", ["53-verify-deed.js", deed, "verify/tampered.txt"], [/✘ Digest matches the document/], { exit: 2 });
fs.rmSync(path.join(HERE, "tampered.txt"));
await step("m6 54 link", ["54-link-deed.js", deed], [/collateral\s+[0-9A-F]{64}/]);
await step("m6 55 sell deed", ["55-sell-deed.js", deed], [/✔ bob buys the deed: tesSUCCESS/, /owner is now BOB/]);

// ── Module 7: oracles ───────────────────────────────────────────────────────
await step("m7 60 publish", ["60-publish-nav.js", "100.37"], [/✔ publish NAV 100\.37 USD: tesSUCCESS/]);
await step("m7 61 read", ["61-read-nav.js"], [/HBOND\/USD = 100\.37/, /median 100\.37/]);
await sleep(3000);
await step("m7 61 stale", ["61-read-nav.js", "", "1"], [/STALE/], { exit: 2 });

// ── Module 8: governance ────────────────────────────────────────────────────
await step("m8 70 signer list", ["70-multisig-setup.js"], [/✔ issuer: 2-of-3 signer list: tesSUCCESS/, /quorum 2, 3 signers/]);
await step("m8 71 multisig freeze", ["71-multisig-freeze.js", "CAROL"], [/✔ freeze carol \(CFO \+ COUNSEL\): tesSUCCESS/, /frozen = true/]);
await step("m8 71 multisig unfreeze", ["71-multisig-freeze.js", "CAROL", "--off"], [/frozen = false/]);
await step("m8 72 disable master", ["72-disable-master.js"], [/tecNO_ALTERNATIVE_KEY/, /✔ disable master, with signer list: tesSUCCESS/, /master key after disabling → tefMASTER_DISABLED/]);

// ── Module 9: Hooks ─────────────────────────────────────────────────────────
await step("m9 who sees what", ["hooks/who-sees-what.js"], [/✔ alice -> bob 1 HBOND: tesSUCCESS/, /✘ alice -> issuer 1 HBOND: tecHOOK_REJECTED/]);
await step("m9 install desk", ["hooks/install-subscription-desk.js", "100"], [/✔ install subscription_desk: tesSUCCESS/]);
await step("m9 prepare alice (already set up)", ["hooks/prepare-subscriber.js", "ALICE"], [/ALICE: HBOND line authorised: true/, /ALICE: [\d.]+ USD/]);
await step("m9 desk: alice subscribes", ["hooks/subscribe-via-desk.js", "ALICE", "1000"], [/subscription accepted/, /ALICE: 478 -> 488 HBOND/]);
await step("m9 desk: carol refused", ["hooks/subscribe-via-desk.js", "CAROL", "1000"], [/tecHOOK_REJECTED.*KYC pending/]);
await step("m9 desk: partial refused", ["hooks/subscribe-via-desk.js", "BOB", "500", "--partial"], [/partial payments are refused/]);
await step("m9 remove desk", ["hooks/install-subscription-desk.js", "--remove"], [/✔ remove subscription_desk: tesSUCCESS/]);
await step("m9 install cap", ["hooks/install-holding-cap.js", "500"], [/✔ install holding_cap: tesSUCCESS/]);
await step("m9 within cap", ["21-transfer.js", "BOB", "ALICE", "5"], [/Cap: within the limit/]);
await step("m9 over cap", ["21-transfer.js", "BOB", "ALICE", "10"], [/✔ .*tesSUCCESS.*Cap: limit exceeded, receiver frozen/]);
await sleep(8000);
await step("m9 alice is frozen", ["21-transfer.js", "ALICE", "BOB", "1"], [/tecPATH_DRY/]);
await step("m9 unfreeze alice", ["22-freeze.js", "ALICE", "--off"], [/✔ unfreeze alice: tesSUCCESS/]);
// A DEX purchase must trip the cap too (HookOn includes OfferCreate). ALICE is still above 500.
await step("m9 over cap on the DEX", ["33-subscribe.js", "ALICE", "1"], [/✔ .*tesSUCCESS.*Cap: limit exceeded, receiver frozen/]);
await sleep(8000);
await step("m9 unfreeze alice again", ["22-freeze.js", "ALICE", "--off"], [/frozen by issuer = false/]);
await step("m9 remove cap", ["hooks/install-holding-cap.js", "--remove"], [/✔ remove holding_cap: tesSUCCESS/]);
// The lockbox: a time lock for HBOND, which EscrowCreate refuses (Module 5).
// Every balance ends where it started, so Module 5's maturity numbers hold.
await step("m9 install lockbox", ["hooks/install-lockbox.js"], [/✔ issuer: authorise vault: tesSUCCESS/, /✔ install lockbox: tesSUCCESS/]);
const lockup = await step("m9 bob locks 20 for himself", ["hooks/lock-tokens.js", "BOB", "BOB", "20", "40"], [/✔ .*tesSUCCESS.*Lock: tokens locked/]);
const lockupId = grab(lockup, /lock ([0-9A-F]{64})/);
await step("m9 lock for carol refused", ["hooks/lock-tokens.js", "ALICE", "CAROL", "5", "40"], [/tecHOOK_REJECTED.*no authorised trust line/]);
await step("m9 vault can't spend", ["21-transfer.js", "VAULT", "BOB", "1"], [/tecHOOK_REJECTED.*only through a release/]);
await step("m9 release too early", ["hooks/release-lock.js", "ALICE", lockupId], [/tecHOOK_REJECTED.*too early/]);
const disputed = await step("m9 alice locks 10 for bob", ["hooks/lock-tokens.js", "ALICE", "BOB", "10", "3600"], [/✔ .*tesSUCCESS.*Lock: tokens locked/]);
const disputedId = grab(disputed, /lock ([0-9A-F]{64})/);
await step("m9 clawback from the vault", ["24-clawback.js", "VAULT", "10"], [/✔ claw back 10 HBOND from vault: tesSUCCESS/, /VAULT: 30 -> 20 HBOND/]);
await step("m9 only the issuer voids", ["hooks/release-lock.js", "BOB", disputedId, "--void"], [/tecHOOK_REJECTED.*only the token's issuer/]);
await step("m9 issuer voids", ["hooks/release-lock.js", "ISSUER", disputedId, "--void"], [/✔ .*tesSUCCESS.*voided by the issuer/]);
await step("m9 reissue to alice", ["21-transfer.js", "ISSUER", "ALICE", "10"], [/✔ .*tesSUCCESS/]);
await sleep(40_000);
await step("m9 release", ["hooks/release-lock.js", "ALICE", lockupId], [/✔ .*tesSUCCESS.*Lock: released/, /beneficiary: \d+(\.\d+)? -> \d+(\.\d+)? HBOND/, /vault holds 0 HBOND/]);
await step("m9 released only once", ["hooks/release-lock.js", "ALICE", lockupId], [/tecHOOK_REJECTED.*no such lock/]);

// ── Module 5 (end of life) ──────────────────────────────────────────────────
// The principal comes from selling the asset (Module 5, lesson 4): STABLE wires it
await step("m5 44 refuses unfunded", ["44-redemption-window.js"], [/Short by [\d.]+ USD: fund the treasury first/], { exit: 1 });
await step("m5 asset sale proceeds", ["-e", 'const {connect,wallet,submit,usd}=require("./lib/xahau");(async()=>{const c=await connect();await submit(c,wallet("STABLE_SEED"),{TransactionType:"Payment",Destination:wallet("TREASURY_SEED").address,Amount:usd(100000)},"asset sale proceeds");await c.disconnect()})()'], [/✔ asset sale proceeds: tesSUCCESS/]);
await step("m5 44 window", ["44-redemption-window.js"], [/✔ redemption window: buy \d+(\.\d+)? HBOND at 100 USD: tesSUCCESS/]);
await step("m5 45 alice redeems", ["45-redeem.js", "ALICE"], [/✔ alice: redeem .*tesSUCCESS/, /ALICE: 0 HBOND/]);
await step("m5 45 bob redeems", ["45-redeem.js", "BOB"], [/✔ bob: redeem .*tesSUCCESS/, /BOB: 0 HBOND/]);
await step("m5 46 retire", ["46-retire-supply.js"], [/HBOND in existence: 0/]);

// ── Module 10: capstone, Module 11: preflight ───────────────────────────────
await step("m10 capstone", ["capstone/run.js"], [/✓ no HARBOR30 left in existence/, /issuer status: matured and fully redeemed/], { timeout: 900_000 });
await step("m11 preflight", ["90-preflight.js"], [/✔ MUST\s+Multisig: 2 of 3/, /No blockers\./]);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Log: verify/last-run.log`);
process.exit(failed.length);

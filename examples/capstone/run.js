// capstone/run.js: a tokenized bond from term sheet to maturity, on testnet
//   node capstone/run.js             every phase, in order
//   node capstone/run.js coupon      one phase (accounts come from accounts.json)
//
// Phases: accounts, issuer, stablecoin, supply, kyc, offering, nav, coupon,
// incident, maturity, audit. Each one checks its own result and stops the run
// if something is off. Everything comes from term-sheet.json.
//
// Run first (from examples/): node 01-create-accounts.js. The capstone creates
// its own accounts, funded by CAROL, so nothing else is needed.
const fs = require("fs");
const path = require("path");
const { Wallet, xahToDrops, hashes } = require("xahau");
const { connect, submit, wallet, fromSeed, toHex, fromHex, currencyCode, trustLine, getObject, writeSecret, dec, tokenValue, ROUND_DOWN } = require("../lib/xahau");
const { install, remove, currencyBytes, accountBytes, u32, param } = require("../hooks/lib");

const TERMS = JSON.parse(fs.readFileSync(path.join(__dirname, "term-sheet.json"), "utf8"));
const ACCOUNTS_FILE = path.join(__dirname, "accounts.json");
const ROLES = ["issuer", "treasury", "stable", "alice", "bob", "dave", "dave2"];
const INVESTORS = Object.keys(TERMS.investors);
const CODE = currencyCode(TERMS.token);
const COUPON = dec(TERMS.faceValueUSD).times(TERMS.couponRatePercent).div(100).div(TERMS.couponsPerYear);
const tf = { SetfAuth: 0x00010000, SetFreeze: 0x00100000, FillOrKill: 0x00040000 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let client, A; // A.alice is a Wallet
const tok = (value) => ({ currency: CODE, issuer: A.issuer.address, value: tokenValue(value) });
const usd = (value) => ({ currency: "USD", issuer: A.stable.address, value: tokenValue(value) });
const balance = async (who, amount) => dec((await trustLine(client, A[who].address, amount.issuer, amount.currency))?.balance ?? 0);
const remark = (name, value, immutable = false) => ({ Remark: { RemarkName: toHex(name), RemarkValue: toHex(value), Flags: immutable ? 1 : 0 } });

/** Stop the run when a step did not do what it must. */
function expect(ok, what) {
  if (!ok) throw new Error(`Check failed: ${what}`);
  console.log(`  ✓ ${what}`);
}
async function must(signer, tx, label) {
  const r = await submit(client, signer, tx, label);
  expect(r.code === "tesSUCCESS", `${label} succeeded`);
  return r;
}

const phases = {
  // Fresh accounts, funded from the course's FUNDER account: no faucet wait
  async accounts() {
    const funder = wallet(process.env.FUNDER ?? "CAROL_SEED");
    const seeds = {};
    for (const role of ROLES) {
      const w = Wallet.generate("ecdsa-secp256k1");
      await must(funder, { TransactionType: "Payment", Destination: w.address, Amount: xahToDrops(40) }, `create ${role}`);
      seeds[role] = w.seed;
    }
    writeSecret(ACCOUNTS_FILE, JSON.stringify(seeds, null, 2));
    load();
  },

  // The issuer's permanent choices, made while it still owns nothing
  async issuer() {
    const i = A.issuer;
    await must(i, { TransactionType: "AccountSet", SetFlag: 2 }, "asfRequireAuth");
    await must(i, { TransactionType: "AccountSet", SetFlag: 17 }, "asfAllowTrustLineClawback");
    await must(i, { TransactionType: "AccountSet", SetFlag: 8 }, "asfDefaultRipple");
    await must(i, { TransactionType: "AccountSet", Domain: toHex(TERMS.domain), TickSize: 5 }, "Domain + TickSize");
    await must(i, {
      TransactionType: "SetRemarks",
      ObjectID: hashes.hashAccountRoot(i.address),
      Remarks: [
        remark("legal_name", TERMS.legalName, true),
        remark("token", `${TERMS.token}: ${TERMS.faceValueUSD} USD face, ${TERMS.couponRatePercent}% fixed, matures ${TERMS.maturity}`, true),
        remark("status", "offering open"),
      ],
    }, "issuer fact sheet");
    const f = (await client.request({ command: "account_info", account: i.address, ledger_index: "validated" })).result.account_flags;
    expect(f.requireAuthorization && f.allowTrustLineClawback && f.defaultRipple, "RequireAuth, Clawback and DefaultRipple are on");
  },

  // A stand-in for a regulated stablecoin, and investors who hold it
  async stablecoin() {
    await must(A.stable, { TransactionType: "AccountSet", SetFlag: 8 }, "stable: asfDefaultRipple");
    for (const who of ["treasury", ...INVESTORS, "dave2"]) {
      await must(A[who], { TransactionType: "TrustSet", LimitAmount: usd(10_000_000) }, `${who}: USD line`);
    }
    for (const who of INVESTORS) {
      await must(A.stable, { TransactionType: "Payment", Destination: A[who].address, Amount: usd(TERMS.investors[who].usd) }, `${who} receives ${TERMS.investors[who].usd} USD`);
    }
  },

  // The whole supply is created once, into the treasury
  async supply() {
    await must(A.treasury, { TransactionType: "TrustSet", LimitAmount: tok(TERMS.supply * 10) }, "treasury: token line");
    await must(A.issuer, { TransactionType: "TrustSet", LimitAmount: { currency: CODE, issuer: A.treasury.address, value: "0" }, Flags: tf.SetfAuth }, "issuer: authorise treasury");
    await must(A.issuer, { TransactionType: "Payment", Destination: A.treasury.address, Amount: tok(TERMS.supply) }, `issue ${TERMS.supply} ${TERMS.token}`);
    expect((await balance("treasury", tok(0))).eq(TERMS.supply), `treasury holds ${TERMS.supply}`);
  },

  // Investors ask, the issuer approves after (simulated) KYC
  async kyc() {
    for (const who of INVESTORS) {
      await must(A[who], { TransactionType: "TrustSet", LimitAmount: tok(TERMS.supply) }, `${who}: request token line`);
      await must(A.issuer, { TransactionType: "TrustSet", LimitAmount: { currency: CODE, issuer: A[who].address, value: "0" }, Flags: tf.SetfAuth }, `issuer: KYC approved ${who}`);
    }
  },

  // The subscription desk Hook sells at face value; its deliveries land a ledger or two later
  async offering() {
    await install(client, A.treasury, "subscription_desk", {
      on: ["Payment"],
      params: [
        param("USD", currencyBytes("USD") + accountBytes(A.stable.address)),
        param("TOK", CODE + accountBytes(A.issuer.address)),
        param("PRICE", u32(TERMS.faceValueUSD)),
      ],
    });
    for (const who of INVESTORS) {
      const pay = TERMS.investors[who].subscribeUSD;
      await must(A[who], { TransactionType: "Payment", Destination: A.treasury.address, Amount: usd(pay) }, `${who} subscribes ${pay} USD`);
    }
    await sleep(8000); // the desk's emitted payments land in the following ledgers
    for (const who of INVESTORS) {
      const want = dec(TERMS.investors[who].subscribeUSD).div(TERMS.faceValueUSD);
      expect((await balance(who, tok(0))).eq(want), `${who} received ${want} ${TERMS.token}`);
    }
    await must(A.issuer, { TransactionType: "SetRemarks", ObjectID: hashes.hashAccountRoot(A.issuer.address), Remarks: [remark("status", "offering closed")] }, "status: offering closed");
  },

  // The administrator publishes NAV as an on-ledger oracle
  async nav() {
    const [, decimals = ""] = TERMS.navUSD.split(".");
    await must(A.issuer, {
      TransactionType: "OracleSet",
      OracleDocumentID: 1,
      Provider: toHex(`${TERMS.legalName} administrator`),
      AssetClass: toHex("bond"),
      LastUpdateTime: Math.floor(Date.now() / 1000),
      PriceDataSeries: [{ PriceData: { BaseAsset: CODE, QuoteAsset: "USD", AssetPrice: dec(TERMS.navUSD).shiftedBy(decimals.length).toString(16), Scale: decimals.length } }],
    }, `publish NAV ${TERMS.navUSD}`);
  },

  // Record date, then one coupon per holder, each tagged with the record date
  async coupon() {
    const ledger = (await client.request({ command: "ledger", ledger_index: "validated" })).result.ledger_index;
    const lines = (await client.request({ command: "account_lines", account: A.issuer.address, ledger_index: ledger })).result.lines;
    const holders = lines.filter((l) => l.currency === CODE && dec(l.balance).lt(0) && l.account !== A.treasury.address);
    let paid = dec(0);
    for (const l of holders) {
      // Exact decimals, rounded down to the cent
      const amount = dec(l.balance).negated().times(COUPON).decimalPlaces(2, ROUND_DOWN);
      await must(A.treasury, {
        TransactionType: "Payment", Destination: l.account, Amount: usd(amount),
        Memos: [{ Memo: { MemoType: toHex("coupon"), MemoData: toHex(`coupon:${ledger}`) } }],
      }, `coupon ${amount} USD`);
      paid = paid.plus(amount);
    }
    expect(holders.length === INVESTORS.length, `${holders.length} holders paid ${paid} USD in total`);
  },

  // Dave loses his keys: freeze, claw back, re-issue to his new, re-verified account
  async incident() {
    const lost = await balance("dave", tok(0));
    await must(A.issuer, { TransactionType: "TrustSet", LimitAmount: { currency: CODE, issuer: A.dave.address, value: "0" }, Flags: tf.SetFreeze }, "freeze dave's old account");
    await must(A.issuer, { TransactionType: "Clawback", Amount: { currency: CODE, issuer: A.dave.address, value: lost.toFixed() } }, `claw back ${lost}`);
    await must(A.dave2, { TransactionType: "TrustSet", LimitAmount: tok(TERMS.supply) }, "dave2: request token line");
    await must(A.issuer, { TransactionType: "TrustSet", LimitAmount: { currency: CODE, issuer: A.dave2.address, value: "0" }, Flags: tf.SetfAuth }, "issuer: KYC approved dave2");
    await must(A.issuer, {
      TransactionType: "Payment", Destination: A.dave2.address, Amount: tok(lost),
      Memos: [{ Memo: { MemoType: toHex("reissue"), MemoData: toHex(`replaces ${A.dave.address}`) } }],
    }, `re-issue ${lost} to dave2`);
    expect((await balance("dave", tok(0))).isZero() && (await balance("dave2", tok(0))).eq(lost), "dave's holding moved to his new account");
  },

  // Maturity: close the desk, open a funded redemption window, holders redeem, supply retired
  async maturity() {
    await remove(client, A.treasury, "close the subscription desk");
    const gb = (await client.request({ command: "gateway_balances", account: A.issuer.address, hotwallet: [A.treasury.address], ledger_index: "validated" })).result;
    const outstanding = dec(gb.obligations?.[CODE] ?? 0);
    const due = outstanding.times(TERMS.faceValueUSD);
    // The money raised bought the asset; at maturity the SPV sells it and the
    // buyer's bank wires the proceeds (here: STABLE pays the treasury directly)
    await must(A.stable, { TransactionType: "Payment", Destination: A.treasury.address, Amount: usd(due) }, `asset sale proceeds: ${due} USD`);
    expect((await balance("treasury", usd(0))).gte(due), `treasury can pay ${due} USD principal`);
    await must(A.treasury, { TransactionType: "OfferCreate", TakerGets: usd(due), TakerPays: tok(outstanding) }, "open the redemption window");
    for (const who of [...INVESTORS, "dave2"]) {
      const units = await balance(who, tok(0));
      if (units.lte(0)) continue;
      await must(A[who], { TransactionType: "OfferCreate", TakerGets: tok(units), TakerPays: usd(units.times(TERMS.faceValueUSD)), Flags: tf.FillOrKill }, `${who} redeems ${units}`);
    }
    const left = await balance("treasury", tok(0));
    await must(A.treasury, { TransactionType: "Payment", Destination: A.issuer.address, Amount: tok(left) }, `retire ${left}`);
    await must(A.issuer, { TransactionType: "SetRemarks", ObjectID: hashes.hashAccountRoot(A.issuer.address), Remarks: [remark("status", "matured and fully redeemed")] }, "status: matured");
  },

  // What an auditor checks at the end, from the ledger alone
  async audit() {
    const gb = (await client.request({ command: "gateway_balances", account: A.issuer.address, ledger_index: "validated" })).result;
    expect(!gb.obligations || Object.keys(gb.obligations).length === 0, `no ${TERMS.token} left in existence`);
    for (const who of ["alice", "bob", "dave2"]) {
      console.log(`  ${who.padEnd(6)} ${await balance(who, tok(0))} ${TERMS.token}, ${await balance(who, usd(0))} USD`);
    }
    const root = await getObject(client, hashes.hashAccountRoot(A.issuer.address));
    const status = root.Remarks.map((r) => r.Remark).find((r) => fromHex(r.RemarkName) === "status");
    console.log(`  issuer status: ${fromHex(status.RemarkValue)}`);
  },
};

function load() {
  if (!fs.existsSync(ACCOUNTS_FILE)) throw new Error("No accounts yet: run the accounts phase first");
  const seeds = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf8"));
  A = Object.fromEntries(Object.entries(seeds).map(([role, seed]) => [role, fromSeed(seed)]));
}

async function main() {
  const only = process.argv[2];
  if (only && !phases[only]) throw new Error(`Unknown phase "${only}". Phases: ${Object.keys(phases).join(", ")}`);
  client = await connect();
  console.log(`${TERMS.name}: ${TERMS.token}, ${TERMS.supply} × ${TERMS.faceValueUSD} USD, coupon ${COUPON} USD per token per period\n`);
  for (const [name, run] of Object.entries(phases)) {
    if (only && name !== only) continue;
    if (name !== "accounts") load();
    console.log(`── ${name}`);
    await run();
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

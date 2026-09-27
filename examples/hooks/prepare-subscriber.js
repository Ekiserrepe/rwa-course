// prepare-subscriber.js: get an account ready to subscribe at the desk
//   node hooks/prepare-subscriber.js <ROLE> [--usd 1000] [--no-kyc]
//   node hooks/prepare-subscriber.js BOB
//   node hooks/prepare-subscriber.js CAROL --no-kyc     (to see the KYC refusal)
//
// The desk only accepts a subscription from an account that can pay and can
// receive: a USD trust line holding enough USD, and an HBOND trust line the
// issuer has authorised. Modules 3 and 4 set this up for ALICE, BOB and CAROL;
// this does it for any role, and skips every step that is already done.
//   --usd N    make sure the account holds at least N USD (default 1000)
//   --no-kyc   open the HBOND line but leave it unapproved
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 30-stablecoin-setup.js
const { connect, wallet, submit, trustLine, bond, usd, dec, BOND_CODE } = require("../lib/xahau");

const tfSetfAuth = 0x00010000;

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  if (!role || role.startsWith("--")) throw new Error("Usage: prepare-subscriber.js <ROLE> [--usd 1000] [--no-kyc]");
  if (["ISSUER", "TREASURY", "STABLE", "VAULT"].includes(role)) {
    throw new Error(`${role} runs the offering; pass an investor role such as ALICE, BOB or CAROL`);
  }
  const usdArg = process.argv.indexOf("--usd");
  const minUsd = dec(usdArg > 0 ? process.argv[usdArg + 1] ?? NaN : 1000);
  if (!minUsd.gte(0)) throw new Error("--usd needs a number, e.g. --usd 1000");
  const kyc = !process.argv.includes("--no-kyc");

  const client = await connect();
  const investor = wallet(`${role}_SEED`);
  const issuer = wallet("ISSUER_SEED");
  const stable = wallet("STABLE_SEED");
  const treasury = wallet("TREASURY_SEED");
  const who = role.toLowerCase();

  // 0. The offering itself must exist (Modules 2 and 4), or no investor can subscribe
  const flags = (await client.request({ command: "account_info", account: issuer.address, ledger_index: "validated" })).result.account_flags;
  if (!flags.requireAuthorization) {
    throw new Error("The ISSUER doesn't require authorisation, so it can't approve anyone: run 10-issuer-setup.js (Module 2). It needs an issuer with no trust lines yet, and tells you how to clear them if there are");
  }
  const stock = await trustLine(client, treasury.address, issuer.address, BOND_CODE);
  if (!dec(stock?.balance ?? 0).gt(0)) {
    throw new Error("The TREASURY holds no HBOND, so the desk has nothing to deliver: run 12-treasury-line.js and 13-issue-supply.js (Module 2) first");
  }
  if (!(await trustLine(client, treasury.address, stable.address, "USD"))) {
    throw new Error("The TREASURY has no USD trust line, so it can't be paid: run 30-stablecoin-setup.js (Module 4) first");
  }

  // 1. Can receive HBOND: a trust line to the issuer (the investor's request)...
  let line = await trustLine(client, investor.address, issuer.address, BOND_CODE);
  if (!line) {
    await submit(client, investor, { TransactionType: "TrustSet", LimitAmount: bond(100_000) }, `${who}: HBOND trust line`);
  }
  // ...that the issuer has authorised (in production, only after KYC)
  line = await trustLine(client, investor.address, issuer.address, BOND_CODE);
  if (kyc && !line.peer_authorized) {
    await submit(client, issuer, {
      TransactionType: "TrustSet",
      LimitAmount: { currency: BOND_CODE, issuer: investor.address, value: "0" },
      Flags: tfSetfAuth,
    }, `issuer: authorise ${who}`);
  }

  // 2. Can pay: a USD trust line, holding at least minUsd
  let cash = await trustLine(client, investor.address, stable.address, "USD");
  if (!cash) {
    await submit(client, investor, { TransactionType: "TrustSet", LimitAmount: usd(10_000_000) }, `${who}: USD trust line`);
    cash = await trustLine(client, investor.address, stable.address, "USD");
  }
  const missing = minUsd.minus(cash.balance);
  if (missing.gt(0)) {
    await submit(client, stable, { TransactionType: "Payment", Destination: investor.address, Amount: usd(missing) }, `stable -> ${who}: ${missing} USD`);
  }

  // Where the account stands now
  line = await trustLine(client, investor.address, issuer.address, BOND_CODE);
  cash = await trustLine(client, investor.address, stable.address, "USD");
  console.log(`  ${role}: HBOND line authorised: ${!!line.peer_authorized}${line.freeze_peer ? ", FROZEN by the issuer" : ""}`);
  console.log(`  ${role}: ${cash.balance} USD`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

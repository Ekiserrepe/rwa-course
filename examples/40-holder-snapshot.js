// 40-holder-snapshot.js: who holds HBOND right now (the "record date" list)
//   node 40-holder-snapshot.js [--save]
//
// Reads every trust line of the issuer at one validated ledger, so the whole
// list comes from the same moment. With --save it writes snapshot.json for
// 41-pay-coupon.js.
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
const fs = require("fs");
const path = require("path");
const { connect, wallet, dec, BOND_CODE } = require("./lib/xahau");

async function main() {
  const client = await connect();
  const issuer = wallet("ISSUER_SEED").address;
  const treasury = wallet("TREASURY_SEED").address;

  // Pin one ledger so every page of results describes the same moment
  const ledger = (await client.request({ command: "ledger", ledger_index: "validated" })).result.ledger_index;
  const holders = [];
  let marker;
  do {
    const res = (await client.request({ command: "account_lines", account: issuer, ledger_index: ledger, limit: 400, marker })).result;
    for (const l of res.lines) {
      const balance = dec(l.balance).negated(); // the issuer sees its obligations as negative
      if (l.currency !== BOND_CODE || balance.lte(0) || l.account === treasury) continue;
      holders.push({ account: l.account, balance: balance.toFixed(), frozen: !!l.freeze });
    }
    marker = res.marker;
  } while (marker);

  const total = holders.reduce((s, h) => s.plus(h.balance), dec(0)).toFixed();
  console.log(`Record date: ledger ${ledger}. ${holders.length} holder(s), ${total} HBOND outside the treasury.`);
  for (const h of holders) console.log(`  ${h.account}  ${h.balance}${h.frozen ? "  (frozen)" : ""}`);

  if (process.argv.includes("--save")) {
    fs.writeFileSync(path.join(__dirname, "snapshot.json"), JSON.stringify({ ledger, holders }, null, 2));
    console.log("Saved snapshot.json");
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

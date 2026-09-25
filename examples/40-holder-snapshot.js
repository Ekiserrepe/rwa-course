// 40-holder-snapshot.js: who holds HBOND right now (the "record date" list)
//   node 40-holder-snapshot.js [--save]
//
// Reads every trust line of the issuer at one validated ledger, so the whole
// list comes from the same moment. With --save it writes snapshot.json for
// 41-pay-coupon.js.
const fs = require("fs");
const { connect, wallet, BOND_CODE } = require("./lib/xahau");

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
      const balance = -Number(l.balance); // the issuer sees its obligations as negative
      if (l.currency !== BOND_CODE || balance <= 0 || l.account === treasury) continue;
      holders.push({ account: l.account, balance, frozen: !!l.freeze });
    }
    marker = res.marker;
  } while (marker);

  const total = holders.reduce((s, h) => s + h.balance, 0);
  console.log(`Record date: ledger ${ledger}. ${holders.length} holder(s), ${total} HBOND outside the treasury.`);
  for (const h of holders) console.log(`  ${h.account}  ${h.balance}${h.frozen ? "  (frozen)" : ""}`);

  if (process.argv.includes("--save")) {
    fs.writeFileSync("snapshot.json", JSON.stringify({ ledger, holders }, null, 2));
    console.log("Saved snapshot.json");
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

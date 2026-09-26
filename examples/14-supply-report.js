// 14-supply-report.js: how much exists, and who holds it
//   node 14-supply-report.js
//
// gateway_balances answers from the issuer's side: "obligations" is the
// supply in circulation. Naming the treasury as a hotwallet separates what
// the issuer's own team holds from what investors hold.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
const { connect, wallet, currencyName, BOND_CODE } = require("./lib/xahau");

async function main() {
  const client = await connect();
  const issuer = wallet("ISSUER_SEED").address;
  const treasury = wallet("TREASURY_SEED").address;

  const gb = (await client.request({
    command: "gateway_balances", account: issuer, hotwallet: [treasury], ledger_index: "validated",
  })).result;

  for (const [code, total] of Object.entries(gb.obligations ?? {})) {
    console.log(`${currencyName(code)} outside the treasury: ${total}`);
  }
  for (const [, amounts] of Object.entries(gb.balances ?? {})) {
    for (const a of amounts) console.log(`${currencyName(a.currency)} in the treasury:        ${a.value}`);
  }
  if (gb.frozen_balances) console.log("Frozen:", JSON.stringify(gb.frozen_balances));

  // The per-holder view: every trust line the issuer is part of
  const lines = (await client.request({ command: "account_lines", account: issuer, ledger_index: "validated" })).result.lines
    .filter((l) => l.currency === BOND_CODE);
  console.log(`\n${lines.length} HBOND trust line(s):`);
  for (const l of lines) {
    // From the issuer's side balances are negative: -500 means "owes 500"
    console.log(`  ${l.account}  ${currencyName(l.currency)}  ${-Number(l.balance)}${l.authorized ? "  authorised" : "  NOT authorised"}${l.freeze ? "  FROZEN" : ""}`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

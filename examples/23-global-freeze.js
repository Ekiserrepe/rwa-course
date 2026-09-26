// 23-global-freeze.js: stop every transfer of the token at once
//   node 23-global-freeze.js         freeze everything
//   node 23-global-freeze.js --off   resume
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 20-onboard-investor.js ALICE --approve
//   node 20-onboard-investor.js BOB --approve
//   node 21-transfer.js TREASURY ALICE 500
//   node 21-transfer.js TREASURY BOB 300
const { connect, wallet, submit } = require("./lib/xahau");

const asfGlobalFreeze = 7;

async function main() {
  const off = process.argv.includes("--off");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");

  await submit(client, issuer, {
    TransactionType: "AccountSet",
    [off ? "ClearFlag" : "SetFlag"]: asfGlobalFreeze,
  }, off ? "clear GlobalFreeze" : "set GlobalFreeze");

  const f = (await client.request({ command: "account_info", account: issuer.address, ledger_index: "validated" })).result.account_flags;
  console.log(`  globalFreeze = ${f.globalFreeze}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

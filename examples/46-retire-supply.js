// 46-retire-supply.js: the TREASURY pays every HBOND it holds back to the issuer
//   node 46-retire-supply.js
//
// Tokens paid to their issuer stop existing. After maturity that is the
// unsold supply plus everything bought back in the redemption window, and the
// supply report should end at zero.
const { connect, wallet, submit, trustLine, bond, toHex, BOND_CODE } = require("./lib/xahau");

async function main() {
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");
  const issuer = wallet("ISSUER_SEED").address;

  const held = Number((await trustLine(client, treasury.address, issuer, BOND_CODE))?.balance ?? 0);
  if (held > 0) {
    await submit(client, treasury, {
      TransactionType: "Payment",
      Destination: issuer,
      Amount: bond(held),
      Memos: [{ Memo: { MemoType: toHex("retire"), MemoData: toHex("maturity") } }],
    }, `retire ${held} HBOND`);
  }
  const gb = (await client.request({ command: "gateway_balances", account: issuer, ledger_index: "validated" })).result;
  console.log(`  HBOND in existence: ${Object.values(gb.obligations ?? {})[0] ?? 0}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

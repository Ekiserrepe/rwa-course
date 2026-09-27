// 46-retire-supply.js: the TREASURY pays every HBOND it holds back to the issuer
//   node 46-retire-supply.js
//
// Tokens paid to their issuer stop existing. After maturity that is the
// unsold supply plus everything bought back in the redemption window, and the
// supply report should end at zero.
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
//   node 44-redemption-window.js
//   node 45-redeem.js ALICE
//   node 45-redeem.js BOB
const { connect, wallet, submit, trustLine, supply, bond, toHex, dec, BOND_CODE } = require("./lib/xahau");

async function main() {
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");
  const issuer = wallet("ISSUER_SEED").address;

  const held = dec((await trustLine(client, treasury.address, issuer, BOND_CODE))?.balance ?? 0);
  if (held.gt(0)) {
    await submit(client, treasury, {
      TransactionType: "Payment",
      Destination: issuer,
      Amount: bond(held),
      Memos: [{ Memo: { MemoType: toHex("retire"), MemoData: toHex("maturity") } }],
    }, `retire ${held} HBOND`);
  }
  // Frozen holdings count too: they are not in gateway_balances' obligations
  console.log(`  HBOND in existence: ${(await supply(client, issuer, BOND_CODE)).total}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

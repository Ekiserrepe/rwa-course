// 44-redemption-window.js: at maturity, the TREASURY bids face value for every HBOND out there
//   node 44-redemption-window.js [faceValueUSD=100]
//
// One OfferCreate: "I give USD, I want HBOND, at 100 USD each", sized to the
// whole supply outside the treasury. Holders then sell into it (45-redeem.js)
// and are paid in the same transaction that takes their tokens.
//
// It refuses to open a window the treasury cannot fund. An offer the owner
// can't pay for is skipped by the DEX, so nobody would lose anything, but a
// redemption promise you can't keep is still a default.
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
//   (and fund the TREASURY with the principal: the script says how much is missing)
const { connect, wallet, submit, trustLine, bond, usd, BOND_CODE } = require("./lib/xahau");

async function main() {
  const face = Number(process.argv[2] ?? 100);
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");
  const issuer = wallet("ISSUER_SEED").address;

  const gb = (await client.request({ command: "gateway_balances", account: issuer, hotwallet: [treasury.address], ledger_index: "validated" })).result;
  // Only HBOND: an issuer may have more than one token outstanding
  const outstanding = Number(gb.obligations?.[BOND_CODE] ?? 0);
  // Escrowed USD (a coupon reserve) is part of the balance but can't be spent
  const line = await trustLine(client, treasury.address, usd(0).issuer, "USD");
  const cash = Number(line?.balance ?? 0) - Number(line?.locked_balance ?? 0);
  const needed = outstanding * face;
  console.log(`Outstanding: ${outstanding} HBOND. Principal due: ${needed} USD. Treasury holds ${cash} USD unlocked.`);
  if (outstanding === 0) throw new Error("Nothing to redeem");
  if (cash < needed) throw new Error(`Short by ${needed - cash} USD: fund the treasury first`);

  const { result } = await submit(client, treasury, {
    TransactionType: "OfferCreate",
    TakerGets: usd(needed),       // what the treasury gives
    TakerPays: bond(outstanding), // what it takes back
  }, `redemption window: buy ${outstanding} HBOND at ${face} USD`);
  console.log(`  Offer sequence ${result.tx_json?.Sequence ?? result.Sequence}. Holders run: node 45-redeem.js <ROLE>`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

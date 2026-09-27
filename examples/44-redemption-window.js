// 44-redemption-window.js: at maturity, the TREASURY bids face value for every HBOND out there
//   node 44-redemption-window.js [faceValueUSD=100]
//
// One OfferCreate: "I give USD, I want HBOND, at 100 USD each", sized to the
// whole supply outside the treasury. Holders then sell into it (45-redeem.js)
// and are paid in the same transaction that takes their tokens.
//
// The treasury's own unsold primary offer (31-primary-offer.js) sells HBOND
// for USD at the same price, so the window would cross it, and the ledger
// removes the older of two crossing offers from the same account. The script
// cancels it explicitly first: the primary sale is over at maturity.
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
const { connect, wallet, submit, trustLine, supply, bond, usd, dec, BOND_CODE } = require("./lib/xahau");

async function main() {
  const face = dec(process.argv[2] ?? 100);
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");
  const issuer = wallet("ISSUER_SEED").address;

  // Only HBOND (an issuer may have more than one token), frozen holdings included:
  // a frozen holder is still owed principal, even if paid another way (Module 5)
  const { outside: outstanding } = await supply(client, issuer, BOND_CODE, [treasury.address]);
  // Escrowed USD (a coupon reserve) is part of the balance but can't be spent
  const line = await trustLine(client, treasury.address, usd(0).issuer, "USD");
  const cash = dec(line?.balance ?? 0).minus(line?.locked_balance ?? 0);
  const needed = outstanding.times(face);
  console.log(`Outstanding: ${outstanding} HBOND. Principal due: ${needed} USD. Treasury holds ${cash} USD unlocked.`);
  if (outstanding.isZero()) throw new Error("Nothing to redeem");
  if (cash.lt(needed)) throw new Error(`Short by ${needed.minus(cash)} USD: fund the treasury first`);

  // Close the primary sale: every offer in which the treasury still sells HBOND
  const { offers } = (await client.request({ command: "account_offers", account: treasury.address, ledger_index: "validated" })).result;
  for (const o of offers.filter((o) => o.taker_gets.currency === BOND_CODE)) {
    await submit(client, treasury, { TransactionType: "OfferCancel", OfferSequence: o.seq }, `close the primary offer (${o.taker_gets.value} HBOND unsold)`);
  }

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

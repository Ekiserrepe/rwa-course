// subscribe-via-desk.js: pay the TREASURY in USD and receive HBOND from its Hook
//   node hooks/subscribe-via-desk.js <ROLE> <amountUSD> [--partial]
//
// --partial sends the payment with tfPartialPayment, which the desk refuses.
// The role needs USD and an authorised HBOND trust line first: if the desk
// refuses for either, run hooks/prepare-subscriber.js <ROLE>.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 30-stablecoin-setup.js
//   node hooks/install-subscription-desk.js
//   node hooks/prepare-subscriber.js ALICE
const { connect, wallet, submit, trustLine, usd, dec, BOND_CODE } = require("../lib/xahau");

const tfPartialPayment = 0x00020000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  const amount = process.argv[3];
  if (!role || !dec(amount ?? NaN).gt(0)) throw new Error("Usage: subscribe-via-desk.js <ROLE> <amountUSD> [--partial]");
  const client = await connect();
  const investor = wallet(`${role}_SEED`);
  const issuer = wallet("ISSUER_SEED").address;
  const before = await trustLine(client, investor.address, issuer, BOND_CODE);
  const cashBefore = await trustLine(client, investor.address, usd(0).issuer, "USD");

  const { code } = await submit(client, investor, {
    TransactionType: "Payment",
    Destination: wallet("TREASURY_SEED").address,
    Amount: usd(amount),
    ...(process.argv.includes("--partial") ? { Flags: tfPartialPayment } : {}),
  }, `${role.toLowerCase()} pays ${amount} USD to the desk`);

  if (code === "tesSUCCESS") {
    // The Hook's payment is a separate, emitted transaction: it lands in a
    // following ledger. If it fails, the Hook's callback refunds the USD.
    for (let i = 0; i < 15; i++) {
      await sleep(2000);
      const now = await trustLine(client, investor.address, issuer, BOND_CODE);
      if (!dec(now.balance).eq(before?.balance ?? 0)) {
        console.log(`  ${role}: ${before?.balance ?? 0} -> ${now.balance} HBOND`);
        break;
      }
      const cash = await trustLine(client, investor.address, usd(0).issuer, "USD");
      if (dec(cash.balance).eq(cashBefore.balance)) {
        console.log(`  ${role}: delivery failed, ${amount} USD refunded`);
        break;
      }
    }
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

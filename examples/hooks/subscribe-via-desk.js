// subscribe-via-desk.js: pay the TREASURY in USD and receive HBOND from its Hook
//   node hooks/subscribe-via-desk.js <ROLE> <amountUSD> [--partial]
//
// --partial sends the payment with tfPartialPayment, which the desk refuses.
const { connect, wallet, submit, trustLine, usd, BOND_CODE } = require("../lib/xahau");

const tfPartialPayment = 0x00020000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  const amount = process.argv[3];
  if (!role || !(Number(amount) > 0)) throw new Error("Usage: subscribe-via-desk.js <ROLE> <amountUSD> [--partial]");
  const client = await connect();
  const investor = wallet(`${role}_SEED`);
  const issuer = wallet("ISSUER_SEED").address;
  const before = await trustLine(client, investor.address, issuer, BOND_CODE);

  const { code } = await submit(client, investor, {
    TransactionType: "Payment",
    Destination: wallet("TREASURY_SEED").address,
    Amount: usd(amount),
    ...(process.argv.includes("--partial") ? { Flags: tfPartialPayment } : {}),
  }, `${role.toLowerCase()} pays ${amount} USD to the desk`);

  if (code === "tesSUCCESS") {
    // The Hook's payment is a separate, emitted transaction: it lands in a following ledger
    for (let i = 0; i < 10; i++) {
      await sleep(2000);
      const now = await trustLine(client, investor.address, issuer, BOND_CODE);
      if (Number(now.balance) !== Number(before?.balance ?? 0)) {
        console.log(`  ${role}: ${before?.balance ?? 0} -> ${now.balance} HBOND`);
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

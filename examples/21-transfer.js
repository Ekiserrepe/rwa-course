// 21-transfer.js: send HBOND from one account to another
//   node 21-transfer.js <FROM> <TO> <amount>
//   node 21-transfer.js TREASURY ALICE 500
//
// Roles are the names in .env: TREASURY, ALICE, BOB, CAROL.
//
// If the issuer charges a TransferRate, a payment between two holders needs a
// SendMax that covers the fee, or it fails with tecPATH_PARTIAL (tested).
const { connect, wallet, submit, trustLine, BOND_CODE, bond } = require("./lib/xahau");

async function main() {
  const [from, to, amount] = process.argv.slice(2).map((s) => s?.toUpperCase());
  if (!from || !to || !(Number(amount) > 0)) throw new Error("Usage: 21-transfer.js <FROM> <TO> <amount>");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED").address;
  const sender = wallet(`${from}_SEED`);
  const receiver = wallet(`${to}_SEED`).address;

  // TransferRate is in billionths: 1002000000 = 0.2% fee. Absent or 0 = no fee.
  const { TransferRate: rate } = (await client.request({ command: "account_info", account: issuer, ledger_index: "validated" })).result.account_data;
  const fee = rate && sender.address !== issuer && receiver !== issuer ? rate / 1e9 : 1;

  await submit(client, sender, {
    TransactionType: "Payment",
    Destination: receiver,
    Amount: bond(amount),
    ...(fee > 1 ? { SendMax: bond(Number(amount) * fee) } : {}), // the most the sender will spend
  }, `${from.toLowerCase()} -> ${to.toLowerCase()}: ${amount} HBOND`);

  for (const [name, addr] of [[from, sender.address], [to, receiver]]) {
    const line = await trustLine(client, addr, issuer, BOND_CODE);
    console.log(`  ${name.padEnd(8)} ${line ? line.balance : "no trust line"}`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

// 21-transfer.js: send HBOND from one account to another
//   node 21-transfer.js <FROM> <TO> <amount>
//   node 21-transfer.js TREASURY ALICE 500
//
// Roles are the names in .env: TREASURY, ALICE, BOB, CAROL.
//
// If the issuer charges a TransferRate, a payment between two holders needs a
// SendMax that covers the fee, or it fails with tecPATH_PARTIAL.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 20-onboard-investor.js ALICE --approve  (and for every receiver)
const { connect, wallet, submit, trustLine, BOND_CODE, bond, dec, tokenValue, ROUND_UP } = require("./lib/xahau");

async function main() {
  const [from, to, amount] = process.argv.slice(2).map((s) => s?.toUpperCase());
  if (!from || !to || !(dec(amount ?? NaN).gt(0))) throw new Error("Usage: 21-transfer.js <FROM> <TO> <amount>");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED").address;
  const sender = wallet(`${from}_SEED`);
  const receiver = wallet(`${to}_SEED`).address;

  // TransferRate is in billionths: 1002000000 = 0.2% fee. Absent or 0 = no fee.
  const { TransferRate: rate } = (await client.request({ command: "account_info", account: issuer, ledger_index: "validated" })).result.account_data;
  const fee = rate && sender.address !== issuer && receiver !== issuer ? dec(rate).div(1e9) : dec(1);

  await submit(client, sender, {
    TransactionType: "Payment",
    Destination: receiver,
    Amount: bond(amount),
    // The most the sender will spend: rounded UP, or the fee isn't covered
    ...(fee.gt(1) ? { SendMax: bond(tokenValue(dec(amount).times(fee), ROUND_UP)) } : {}),
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

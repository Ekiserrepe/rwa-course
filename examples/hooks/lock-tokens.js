// lock-tokens.js: lock HBOND in the VAULT for a beneficiary until a given time
//   node hooks/lock-tokens.js <FROM> <BENEFICIARY> <amount> <seconds>
//   node hooks/lock-tokens.js BOB BOB 20 60      (a lock-up of Bob's own tokens)
//
// An ordinary payment to the vault, carrying two HookParameters: BEN (who
// receives the tokens) and AFTER (when). The lockbox Hook refuses it if either
// is missing or the beneficiary can't hold HBOND, so the tokens never move.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 20-onboard-investor.js ALICE --approve
//   node 20-onboard-investor.js BOB --approve
//   node 21-transfer.js TREASURY ALICE 500
//   node 21-transfer.js TREASURY BOB 300
//   node hooks/install-lockbox.js
const { connect, wallet, submit, bond } = require("../lib/xahau");
const { accountBytes, u32, param } = require("./lib");

const RIPPLE_EPOCH = 946684800; // ledger time counts seconds from 2000-01-01

async function main() {
  const [from, to] = process.argv.slice(2, 4).map((s) => s?.toUpperCase());
  const amount = process.argv[4];
  const seconds = Number(process.argv[5]);
  if (!from || !to || !(Number(amount) > 0) || !(seconds > 0)) {
    throw new Error("Usage: lock-tokens.js <FROM> <BENEFICIARY> <amount> <seconds>");
  }
  const client = await connect();
  const after = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH + seconds;

  const { code, hash } = await submit(client, wallet(`${from}_SEED`), {
    TransactionType: "Payment",
    Destination: wallet("VAULT_SEED").address,
    Amount: bond(amount),
    HookParameters: [
      param("BEN", accountBytes(wallet(`${to}_SEED`).address)),
      param("AFTER", u32(after)),
    ],
  }, `${from.toLowerCase()} locks ${amount} HBOND for ${to.toLowerCase()}`);

  if (code === "tesSUCCESS") {
    console.log(`  lock ${hash}`);
    console.log(`  releases after ${new Date((after + RIPPLE_EPOCH) * 1000).toISOString()} with:`);
    console.log(`  node hooks/release-lock.js <ROLE> ${hash}`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

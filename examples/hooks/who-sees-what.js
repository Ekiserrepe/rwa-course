// who-sees-what.js: can the ISSUER's Hook stop a transfer of its own token?
//   node hooks/who-sees-what.js
//
// Installs probe.wasm (refuse everything that isn't the account's own) on the
// ISSUER, then sends HBOND two ways, then removes the probe:
//   holder -> holder: the issuer is only a weak party, the Hook is not asked
//   holder -> issuer: the issuer is the destination, a strong party: refused
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 20-onboard-investor.js ALICE --approve
//   node 20-onboard-investor.js BOB --approve
//   node 21-transfer.js TREASURY ALICE 500
//   node 21-transfer.js TREASURY BOB 300
const { connect, wallet, submit, bond } = require("../lib/xahau");
const { install, remove } = require("./lib");

async function main() {
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  const alice = wallet("ALICE_SEED");

  await install(client, issuer, "probe", { on: ["Payment"] });
  await submit(client, alice, { TransactionType: "Payment", Destination: wallet("BOB_SEED").address, Amount: bond(1) }, "alice -> bob 1 HBOND");
  await submit(client, alice, { TransactionType: "Payment", Destination: issuer.address, Amount: bond(1) }, "alice -> issuer 1 HBOND");
  await remove(client, issuer, "remove probe");
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

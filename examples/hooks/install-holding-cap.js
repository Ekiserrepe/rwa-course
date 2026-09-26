// install-holding-cap.js: freeze anyone who ends up holding more than MAX HBOND
//   node hooks/install-holding-cap.js [max=500]
//   node hooks/install-holding-cap.js --remove
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 20-onboard-investor.js ALICE --approve
//   node 20-onboard-investor.js BOB --approve
//   node 21-transfer.js TREASURY ALICE 500
//   node 21-transfer.js TREASURY BOB 300
const { connect, wallet, BOND_CODE } = require("../lib/xahau");
const { install, remove, u32, param } = require("./lib");

async function main() {
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  if (process.argv.includes("--remove")) {
    await remove(client, issuer, "remove holding_cap");
  } else {
    const max = Number(process.argv[2] ?? 500);
    await install(client, issuer, "holding_cap", {
      on: ["Payment", "OfferCreate"], // without OfferCreate, DEX trades never reach it
      params: [param("TOK", BOND_CODE), param("MAX", u32(max))],
      collect: true, // the issuer is only a weak party to transfers between holders
    });
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

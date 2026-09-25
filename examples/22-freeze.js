// 22-freeze.js: freeze, deep-freeze or unfreeze one holder's trust line
//   node 22-freeze.js <ROLE>            freeze: the holder can only send back to the issuer
//   node 22-freeze.js <ROLE> --deep     deep freeze: it can only deal with the issuer itself
//   node 22-freeze.js <ROLE> --off      lift both
const { connect, wallet, submit, trustLine, BOND_CODE } = require("./lib/xahau");

const tf = {
  SetFreeze: 0x00100000,
  ClearFreeze: 0x00200000,
  SetDeepFreeze: 0x00400000,   // needs SetFreeze in the same (or an earlier) transaction
  ClearDeepFreeze: 0x00800000,
};

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  if (!role) throw new Error("Usage: 22-freeze.js <ROLE> [--deep|--off]");
  const deep = process.argv.includes("--deep");
  const off = process.argv.includes("--off");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  const holder = wallet(`${role}_SEED`).address;

  const Flags = off ? tf.ClearFreeze | tf.ClearDeepFreeze : deep ? tf.SetFreeze | tf.SetDeepFreeze : tf.SetFreeze;
  await submit(client, issuer, {
    TransactionType: "TrustSet",
    // The issuer's view of the line: currency, and the HOLDER as "issuer"
    LimitAmount: { currency: BOND_CODE, issuer: holder, value: "0" },
    Flags,
  }, `${off ? "unfreeze" : deep ? "deep-freeze" : "freeze"} ${role.toLowerCase()}`);

  const line = await trustLine(client, holder, issuer.address, BOND_CODE);
  console.log(`  ${role}: frozen by issuer = ${!!line.freeze_peer}, deep = ${!!line.deep_freeze_peer}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

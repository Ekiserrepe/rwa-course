// 71-multisig-freeze.js: two officers freeze a holder, the issuer's key untouched
//   node 71-multisig-freeze.js <HOLDER> [--off]
//   node 71-multisig-freeze.js CAROL          freeze CAROL's HBOND line
//   node 71-multisig-freeze.js CAROL --off    lift it
//
// HOLDER is the account being frozen (ALICE, BOB, CAROL): one with an HBOND
// trust line. The signers are always CFO and COUNSEL, from 70-multisig-setup.js.
//
// 1. Someone prepares the transaction (fee sized for 2 signatures)
// 2. Each officer signs it on their own machine: sign(tx, true) = "as a co-signer"
// 3. The signatures are combined and submitted. The ISSUER's seed is never used.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 20-onboard-investor.js CAROL  (the holder to freeze needs an HBOND line)
//   node 70-multisig-setup.js
const { multisign } = require("xahau");
const { connect, wallet, trustLine, BOND_CODE } = require("./lib/xahau");

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  if (!role) throw new Error("Usage: 71-multisig-freeze.js <HOLDER> [--off], e.g. CAROL");
  if (["ISSUER", "CFO", "COO", "COUNSEL"].includes(role)) {
    throw new Error(`${role} signs or issues; the argument is the HOLDER to freeze, e.g. CAROL`);
  }
  const off = process.argv.includes("--off");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED").address; // only the address is needed
  const holder = wallet(`${role}_SEED`).address;
  if (!(await trustLine(client, holder, issuer, BOND_CODE))) {
    throw new Error(`${role} has no HBOND trust line, so there is nothing to freeze`);
  }

  // 1. Prepare. The second argument tells autofill how many signers will sign
  const tx = await client.autofill({
    TransactionType: "TrustSet",
    Account: issuer,
    LimitAmount: { currency: BOND_CODE, issuer: holder, value: "0" },
    Flags: off ? 0x00200000 : 0x00100000, // tfClearFreeze : tfSetFreeze
  }, 2);

  // 2. Two of the three officers sign, independently
  const a = wallet("CFO_SEED").sign(tx, true);
  const b = wallet("COUNSEL_SEED").sign(tx, true);

  // 3. Combine and submit
  const res = await client.submitAndWait(multisign([a.tx_blob, b.tx_blob]));
  const code = res.result.meta.TransactionResult;
  console.log(`${code === "tesSUCCESS" ? "✔" : "✘"} ${off ? "unfreeze" : "freeze"} ${role.toLowerCase()} (CFO + COUNSEL): ${code}`);

  const line = await trustLine(client, holder, issuer, BOND_CODE);
  console.log(`  ${role}: frozen = ${!!line?.freeze_peer}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

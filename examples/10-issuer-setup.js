// 10-issuer-setup.js: configure the ISSUER account before anyone holds the token
//   node 10-issuer-setup.js
//   node 10-issuer-setup.js --remove-empty-lines
//
// Order matters: RequireAuth and AllowTrustLineClawback can only be switched on
// while the issuer's owner directory is empty: no trust line to it, and no
// object of its own (signer list, oracle, offer, escrow, Hook…). Otherwise the
// ledger answers tecOWNERS. So they come first, before any holder exists.
// AccountSet takes one SetFlag per transaction.
//
// If the directory isn't empty, the script stops before sending anything.
// Lines of the course's own roles that hold nothing can be removed first with
// --remove-empty-lines (each holder sets its limit to 0, with tfSetNoRipple).
//
// Run first (from examples/): node 01-create-accounts.js, and nothing that opens
// a trust line to the issuer: this script must run before any holder exists.
const { connect, wallet, submit, toHex } = require("./lib/xahau");

const tfSetNoRipple = 0x00020000; // with a 0 limit, returns the line to its default state so it is deleted
const ROLES = ["TREASURY", "ALICE", "BOB", "CAROL", "STABLE", "VAULT"];

/** The course roles in .env, by address. */
function courseRoles() {
  const byAddress = {};
  for (const role of ROLES) if (process.env[`${role}_SEED`]) byAddress[wallet(`${role}_SEED`).address] = role;
  return byAddress;
}

const asf = {
  RequireAuth: 2,             // holders need the issuer's approval (KYC)
  DefaultRipple: 8,           // the token can move between holders
  AllowTrustLineClawback: 17, // the issuer can take tokens back. Permanent. (16 on the XRP Ledger!)
};

async function main() {
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");

  const info = async () => (await client.request({ command: "account_info", account: issuer.address, ledger_index: "validated" })).result;
  const lines = async () => (await client.request({ command: "account_lines", account: issuer.address, ledger_index: "validated" })).result.lines;
  // Everything in the owner directory: trust lines (either side) and the account's own objects
  const objects = async () => (await client.request({ command: "account_objects", account: issuer.address, ledger_index: "validated" })).result.account_objects;
  const flags = (await info()).account_flags;
  const pending = !flags.requireAuthorization || !flags.allowTrustLineClawback;

  // 1. RequireAuth and clawback need an empty owner directory
  if (pending && (await objects()).length > 0) {
    const roles = courseRoles();
    if (process.argv.includes("--remove-empty-lines")) {
      for (const line of await lines()) {
        const role = roles[line.account];
        if (!role || Number(line.balance) !== 0) continue;
        await submit(client, wallet(`${role}_SEED`), {
          TransactionType: "TrustSet",
          LimitAmount: { currency: line.currency, issuer: issuer.address, value: "0" },
          Flags: tfSetNoRipple,
        }, `${role.toLowerCase()}: remove its empty trust line`);
      }
    }
    const left = await objects();
    if (left.length > 0) {
      console.error("✘ The issuer's owner directory isn't empty, so RequireAuth and clawback can't be switched on:");
      for (const l of await lines()) console.error(`    trust line  ${roles[l.account] ?? l.account}  balance ${l.balance}`);
      for (const o of left.filter((o) => o.LedgerEntryType !== "RippleState")) console.error(`    ${o.LedgerEntryType}  ${o.index}`);
      console.error("  Lines of course roles that hold nothing: run again with --remove-empty-lines.");
      console.error("  Other objects (signer list, oracle, offer…): delete them first.");
      console.error("  Lines that hold tokens, or belong to other accounts: start over with a new issuer (node 01-create-accounts.js).");
      process.exit(1);
    }
  }

  if (!flags.requireAuthorization) {
    await submit(client, issuer, { TransactionType: "AccountSet", SetFlag: asf.RequireAuth }, "asfRequireAuth");
  }
  if (!flags.allowTrustLineClawback) {
    await submit(client, issuer, { TransactionType: "AccountSet", SetFlag: asf.AllowTrustLineClawback }, "asfAllowTrustLineClawback");
  }
  await submit(client, issuer, { TransactionType: "AccountSet", SetFlag: asf.DefaultRipple }, "asfDefaultRipple");

  // Fields, unlike flags, can go together in one AccountSet
  await submit(client, issuer, {
    TransactionType: "AccountSet",
    Domain: toHex("harbor-bond.example"), // where the issuer's public information lives
    TransferRate: 0,                        // 0 = no fee on holder-to-holder transfers
    TickSize: 5,                            // DEX prices rounded to 5 significant digits
  }, "Domain + TransferRate + TickSize");

  const { account_data: a, account_flags: f } = await info();
  console.log("\nIssuer", issuer.address);
  console.log("  requireAuthorization:  ", f.requireAuthorization);
  console.log("  allowTrustLineClawback:", f.allowTrustLineClawback);
  console.log("  defaultRipple:         ", f.defaultRipple);
  console.log("  noFreeze:              ", f.noFreeze);
  console.log("  Domain:                ", Buffer.from(a.Domain, "hex").toString());
  console.log("  TickSize:              ", a.TickSize);
  await client.disconnect();
  if (!f.requireAuthorization || !f.allowTrustLineClawback) {
    throw new Error("RequireAuth and clawback must both be on before any holder exists; see the ✘ lines above");
  }
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

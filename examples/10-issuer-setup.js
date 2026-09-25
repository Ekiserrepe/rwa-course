// 10-issuer-setup.js: configure the ISSUER account before anyone holds the token
//   node 10-issuer-setup.js
//
// Order matters: RequireAuth and AllowTrustLineClawback can only be switched on
// while the issuer owns no trust lines, so they come first, before any holder
// exists. AccountSet takes one SetFlag per transaction.
const { connect, wallet, submit, toHex } = require("./lib/xahau");

const asf = {
  RequireAuth: 2,             // holders need the issuer's approval (KYC)
  DefaultRipple: 8,           // the token can move between holders
  AllowTrustLineClawback: 17, // the issuer can take tokens back. Permanent. (16 on the XRP Ledger!)
};

async function main() {
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");

  await submit(client, issuer, { TransactionType: "AccountSet", SetFlag: asf.RequireAuth }, "asfRequireAuth");
  await submit(client, issuer, { TransactionType: "AccountSet", SetFlag: asf.AllowTrustLineClawback }, "asfAllowTrustLineClawback");
  await submit(client, issuer, { TransactionType: "AccountSet", SetFlag: asf.DefaultRipple }, "asfDefaultRipple");

  // Fields, unlike flags, can go together in one AccountSet
  await submit(client, issuer, {
    TransactionType: "AccountSet",
    Domain: toHex("harbor-bond.example"), // where the issuer's public information lives
    TransferRate: 0,                        // 0 = no fee on holder-to-holder transfers
    TickSize: 5,                            // DEX prices rounded to 5 significant digits
  }, "Domain + TransferRate + TickSize");

  const { account_data: a, account_flags: f } = (await client.request({
    command: "account_info", account: issuer.address, ledger_index: "validated",
  })).result;
  console.log("\nIssuer", issuer.address);
  console.log("  requireAuthorization:  ", f.requireAuthorization);
  console.log("  allowTrustLineClawback:", f.allowTrustLineClawback);
  console.log("  defaultRipple:         ", f.defaultRipple);
  console.log("  noFreeze:              ", f.noFreeze);
  console.log("  Domain:                ", Buffer.from(a.Domain, "hex").toString());
  console.log("  TickSize:              ", a.TickSize);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

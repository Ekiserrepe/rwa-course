// 15-issuer-profile.js: a public fact sheet on the issuer account itself
//   node 15-issuer-profile.js
//
// Remarks on the issuer's AccountRoot: anyone who looks up the token's issuer
// sees them, no website needed. The legal name and the prospectus digest are
// immutable; the status can change.
const crypto = require("crypto");
const { hashes } = require("xahau");
const { connect, wallet, submit, toHex, fromHex, getObject, BOND_CODE } = require("./lib/xahau");

const remark = (name, value, immutable = false) => ({
  Remark: { RemarkName: toHex(name), RemarkValue: toHex(value), Flags: immutable ? 1 : 0 },
});

async function main() {
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  const rootId = hashes.hashAccountRoot(issuer.address);
  // Stand-in for the real prospectus PDF
  const prospectus = crypto.createHash("sha256").update("Harbor Bond 2030 prospectus v1").digest("hex").toUpperCase();

  await submit(client, issuer, {
    TransactionType: "SetRemarks",
    ObjectID: rootId,
    Remarks: [
      remark("legal_name", "Harbor Bond SPV Ltd.", true),
      remark("token", `${BOND_CODE} (HBOND): 100 USD face, 5% fixed, matures 2030-06-30`, true),
      remark("prospectus_sha256", prospectus, true),
      remark("status", "offering open"),
    ],
  }, "issuer fact sheet");

  const root = await getObject(client, rootId);
  for (const { Remark: r } of root.Remarks) {
    console.log(`  ${fromHex(r.RemarkName).padEnd(18)} ${fromHex(r.RemarkValue)}${r.Flags & 1 ? "  (immutable)" : ""}`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

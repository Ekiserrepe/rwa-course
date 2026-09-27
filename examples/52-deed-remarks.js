// 52-deed-remarks.js: facts about the asset, written on the token itself
//   node 52-deed-remarks.js <URITokenID>
//
// Immutable remarks for what must never change (the parcel, the jurisdiction),
// mutable ones for what does (the lien, the latest valuation). Only the
// token's issuer can set them, whoever owns the token.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 51-mint-deed.js  (it prints the URITokenID to pass here)
const { connect, wallet, submit, toHex, fromHex, getObject } = require("./lib/xahau");

const remark = (name, value, immutable = false) => ({
  Remark: { RemarkName: toHex(name), RemarkValue: toHex(value), Flags: immutable ? 1 : 0 },
});

async function main() {
  const id = process.argv[2];
  if (!/^[0-9A-F]{64}$/i.test(id ?? "")) throw new Error("Usage: 52-deed-remarks.js <URITokenID>");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");

  await submit(client, issuer, {
    TransactionType: "SetRemarks",
    ObjectID: id,
    Remarks: [
      remark("parcel", "PX-2291-0007", true),
      remark("jurisdiction", "Port Example land registry", true),
      remark("lien", "pledged to HBOND holders"),
      remark("valuation", "1150000 USD @ 2026-06-30"),
    ],
  }, "describe the deed");

  // A year later the valuer updates the figure; the parcel cannot change
  await submit(client, issuer, { TransactionType: "SetRemarks", ObjectID: id, Remarks: [remark("valuation", "1185000 USD @ 2027-06-30")] }, "update valuation");
  await submit(client, issuer, { TransactionType: "SetRemarks", ObjectID: id, Remarks: [remark("parcel", "PX-0000-0000")] }, "try to change the parcel", { expect: ["tecIMMUTABLE"] });

  const token = await getObject(client, id);
  for (const { Remark: r } of token.Remarks) {
    console.log(`  ${fromHex(r.RemarkName).padEnd(13)} ${fromHex(r.RemarkValue)}${r.Flags & 1 ? "  (immutable)" : ""}`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

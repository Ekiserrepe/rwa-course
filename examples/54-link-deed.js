// 54-link-deed.js: tie the bond, the deed and the issuer together on the ledger
//   node 54-link-deed.js <URITokenID>
//
// A reader starting from ANY of the three can find the other two:
//   issuer account --remarks-->  token code + deed ID
//   deed token     --remarks-->  issuer + token code it secures
//   the token code's issuer is the issuer account itself
const { hashes } = require("xahau");
const { connect, wallet, submit, toHex, fromHex, getObject, BOND_CODE } = require("./lib/xahau");

const remark = (name, value, immutable = false) => ({
  Remark: { RemarkName: toHex(name), RemarkValue: toHex(value), Flags: immutable ? 1 : 0 },
});

async function main() {
  const id = process.argv[2];
  if (!/^[0-9A-F]{64}$/i.test(id ?? "")) throw new Error("Usage: 54-link-deed.js <URITokenID>");
  const client = await connect();
  const issuer = wallet("ISSUER_SEED");

  await submit(client, issuer, {
    TransactionType: "SetRemarks",
    ObjectID: id,
    Remarks: [remark("secures", `${BOND_CODE}.${issuer.address}`, true)],
  }, "deed -> bond");

  await submit(client, issuer, {
    TransactionType: "SetRemarks",
    ObjectID: hashes.hashAccountRoot(issuer.address),
    Remarks: [remark("collateral", id)],
  }, "issuer -> deed");

  const root = await getObject(client, hashes.hashAccountRoot(issuer.address));
  console.log("Issuer account remarks:");
  for (const { Remark: r } of root.Remarks) console.log(`  ${fromHex(r.RemarkName).padEnd(18)} ${fromHex(r.RemarkValue)}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

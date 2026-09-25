// 53-verify-deed.js: does this document match this token?
//   node 53-verify-deed.js <URITokenID> [file=assets/warehouse-deed.txt]
//
// What a buyer, a lender or an auditor runs before relying on a deed token:
// the digest on the ledger must equal the digest of the document in hand,
// and the token must come from the issuer they expect.
const crypto = require("crypto");
const fs = require("fs");
const { connect, wallet, fromHex, getObject } = require("./lib/xahau");

async function main() {
  const [id, file = "assets/warehouse-deed.txt"] = process.argv.slice(2);
  if (!/^[0-9A-F]{64}$/i.test(id ?? "")) throw new Error("Usage: 53-verify-deed.js <URITokenID> [file]");
  const client = await connect();
  const token = await getObject(client, id);
  await client.disconnect();
  if (!token) throw new Error("No such URIToken (burned, or never minted)");

  const local = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").toUpperCase();
  const checks = [
    ["issued by the expected issuer", token.Issuer === wallet("ISSUER_SEED").address],
    ["has a Digest", !!token.Digest],
    ["Digest matches the document", token.Digest === local],
  ];
  console.log(`URI: ${fromHex(token.URI)}\nOwner: ${token.Owner}`);
  for (const [what, ok] of checks) console.log(`  ${ok ? "✔" : "✘"} ${what}`);
  if (checks.some(([, ok]) => !ok)) process.exitCode = 2;
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

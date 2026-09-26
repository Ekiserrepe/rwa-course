// 51-mint-deed.js: one real asset, one URIToken
//   node 51-mint-deed.js [uri]
//
// The ISSUER (the SPV that owns the warehouse) mints a URIToken that points
// to the title document and carries its SHA-256 as Digest. tfBurnable lets
// the issuer revoke it later, e.g. if a court orders the register corrected.
//
// Run first (from examples/):
//   node 01-create-accounts.js
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { hashes } = require("xahau");
const { connect, wallet, submit, toHex, getObject } = require("./lib/xahau");

const tfBurnable = 1;

async function main() {
  // In production: the document's IPFS CID or your registry's permanent URL.
  // The timestamp keeps each course run's URI (and so its ID) unique.
  const uri = process.argv[2] ?? `https://harbor-bond.example/deeds/PX-2291-0007?run=${Date.now()}`;
  const doc = fs.readFileSync(path.join(__dirname, "assets/warehouse-deed.txt"));
  const digest = crypto.createHash("sha256").update(doc).digest("hex").toUpperCase();

  const client = await connect();
  const issuer = wallet("ISSUER_SEED");
  const id = hashes.hashURIToken(issuer.address, uri); // known before minting

  await submit(client, issuer, {
    TransactionType: "URITokenMint",
    URI: toHex(uri),
    Digest: digest,
    Flags: tfBurnable,
  }, "mint the deed");

  const token = await getObject(client, id);
  console.log(`  URITokenID: ${id}`);
  console.log(`  Owner:  ${token.Owner}`);
  console.log(`  Digest: ${token.Digest}`);
  console.log(`  Next: node 52-deed-remarks.js ${id}`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

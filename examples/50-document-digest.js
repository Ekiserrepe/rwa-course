// 50-document-digest.js: the fingerprint that ties a token to a legal document
//   node 50-document-digest.js [file=assets/warehouse-deed.txt]
//
// SHA-256 turns any file into 32 bytes. The same file always gives the same
// digest; any change, even one character, gives a completely different one.
const crypto = require("crypto");
const fs = require("fs");

const file = process.argv[2] ?? "assets/warehouse-deed.txt";
const bytes = fs.readFileSync(file);
const digest = crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
console.log(`${file} (${bytes.length} bytes)`);
console.log(`  SHA-256: ${digest}`);

// Show what one changed character does
const tampered = Buffer.from(bytes.toString("utf8").replace("1,150,000", "1,950,000"));
const other = crypto.createHash("sha256").update(tampered).digest("hex").toUpperCase();
console.log(`  after changing the valuation: ${other}`);

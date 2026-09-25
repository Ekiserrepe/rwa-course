// 11-currency-code.js: how a token's name is written on the ledger
//   node 11-currency-code.js [name ...]
const { currencyCode, currencyName } = require("./lib/xahau");

const names = process.argv.slice(2);
for (const name of names.length ? names : ["USD", "EUR", "HBOND", "HARBOR-2030", "XAH"]) {
  try {
    const code = currencyCode(name);
    const kind = code.length === 3 ? "standard (3 chars)" : "non-standard (40 hex)";
    console.log(`${name.padEnd(12)} -> ${code.padEnd(40)}  ${kind}, reads back as "${currencyName(code)}"`);
  } catch (err) {
    console.log(`${name.padEnd(12)} -> ✘ ${err.message}`);
  }
}

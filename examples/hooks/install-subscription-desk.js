// install-subscription-desk.js: put the always-open issuance desk on the TREASURY
//   node hooks/install-subscription-desk.js [priceUSD=100]
//   node hooks/install-subscription-desk.js --remove
const { connect, wallet, BOND_CODE } = require("../lib/xahau");
const { install, remove, currencyBytes, accountBytes, u32, param } = require("./lib");

async function main() {
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");
  if (process.argv.includes("--remove")) {
    await remove(client, treasury, "remove subscription_desk");
  } else {
    const price = Number(process.argv[2] ?? 100);
    await install(client, treasury, "subscription_desk", {
      on: ["Payment"],
      params: [
        param("USD", currencyBytes("USD") + accountBytes(wallet("STABLE_SEED").address)),
        param("TOK", currencyBytes(BOND_CODE) + accountBytes(wallet("ISSUER_SEED").address)),
        param("PRICE", u32(price)),
      ],
    });
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

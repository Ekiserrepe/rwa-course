// install-subscription-desk.js: put the always-open issuance desk on the TREASURY
//   node hooks/install-subscription-desk.js [priceUSD=100]
//   node hooks/install-subscription-desk.js --remove
//
// The desk keeps its reservations and pending deliveries in its Hook state.
// --remove refuses while any are still there: without the Hook, a delivery
// that fails could no longer be refunded. Wait a few ledgers and try again.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 30-stablecoin-setup.js
const crypto = require("crypto");
const { connect, wallet, BOND_CODE } = require("../lib/xahau");
const { install, remove, currencyBytes, accountBytes, u32, param } = require("./lib");

async function main() {
  const client = await connect();
  const treasury = wallet("TREASURY_SEED");
  if (process.argv.includes("--remove")) {
    const namespace_id = crypto.createHash("sha256").update("subscription_desk").digest("hex").toUpperCase();
    const { namespace_entries: pending = [] } = (await client.request({
      command: "account_namespace", account: treasury.address, namespace_id, ledger_index: "validated",
    }).catch(() => ({ result: {} }))).result;
    if (pending.length > 0) throw new Error(`${pending.length} subscription(s) still settling in the desk's state: try again in a few seconds`);
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

// 00-look-around.js: read the network and an account without spending anything
//   node 00-look-around.js [rAddress]
// Reading uses requests (free). Only transactions change the ledger (and cost a fee).
const { dropsToXah } = require("xahau");
const { connect, wallet, NETWORK } = require("./lib/xahau");

async function main() {
  const client = await connect();
  const account = process.argv[2] ?? wallet("ISSUER_SEED").address;

  // The network: which ledger we are on, the fee, the reserves
  const { info } = (await client.request({ command: "server_info" })).result;
  console.log(`Network ${NETWORK} (NetworkID ${info.network_id ?? "?"})`);
  console.log(`  last validated ledger ${info.validated_ledger.seq}, closed ${info.validated_ledger.age}s ago`);
  console.log(`  base fee ${info.validated_ledger.base_fee_xrp} XAH, reserves ${info.validated_ledger.reserve_base_xrp} + ${info.validated_ledger.reserve_inc_xrp} XAH per object\n`);

  // The account's own object
  const a = (await client.request({ command: "account_info", account, ledger_index: "validated" })).result.account_data;
  console.log(`Account ${account}`);
  console.log(`  balance ${dropsToXah(a.Balance)} XAH, owns ${a.OwnerCount} object(s)\n`);

  // Everything else it owns, grouped by type (first page only)
  const objs = (await client.request({ command: "account_objects", account, ledger_index: "validated", limit: 400 })).result.account_objects;
  const byType = {};
  for (const o of objs) byType[o.LedgerEntryType] = (byType[o.LedgerEntryType] ?? 0) + 1;
  console.log("  ledger objects it owns:", byType);
  const listed = objs.length;
  if (listed < a.OwnerCount) {
    // Hook state entries also lock reserve but live in the Hook's namespace:
    // list them with the account_namespace command (Module 9)
    console.log(`  (${a.OwnerCount - listed} more count toward the reserve without being listed here, e.g. Hook state entries)`);
  }
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

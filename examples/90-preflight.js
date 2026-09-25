// 90-preflight.js: read an issuer account and report what is (and isn't) ready
//   node 90-preflight.js [rIssuer]
//
// Read-only: it only asks questions. Run it against your testnet issuer
// before launch, and against the mainnet one before you open the offering.
const { hashes } = require("xahau");
const { connect, wallet, fromHex, getObject } = require("./lib/xahau");

async function main() {
  const issuer = process.argv[2] || wallet("ISSUER_SEED").address;
  const client = await connect();
  const { account_data: a, account_flags: f } = (await client.request({ command: "account_info", account: issuer, ledger_index: "validated" })).result;
  const signers = (await client.request({ command: "account_objects", account: issuer, type: "signer_list", ledger_index: "validated" })).result.account_objects[0];
  const hooks = (await client.request({ command: "account_objects", account: issuer, type: "hook", ledger_index: "validated" })).result.account_objects;
  const root = await getObject(client, hashes.hashAccountRoot(issuer));
  const remarks = Object.fromEntries((root.Remarks ?? []).map(({ Remark: r }) => [fromHex(r.RemarkName), fromHex(r.RemarkValue)]));
  await client.disconnect();

  const rows = [
    // [ok, level, message]  level: MUST = don't launch without it, SHOULD = decide consciously
    [f.requireAuthorization, "MUST", "RequireAuth: only approved accounts can hold the token"],
    [f.defaultRipple, "MUST", "DefaultRipple: holders can transfer to each other"],
    [!f.noFreeze, "MUST", "NoFreeze is off: you can still freeze in an emergency"],
    [f.allowTrustLineClawback, "SHOULD", "Clawback enabled (note: it rules out token escrows)"],
    [!!a.Domain, "SHOULD", `Domain set${a.Domain ? `: ${fromHex(a.Domain)}` : ""}`],
    [!!signers, "MUST", signers ? `Multisig: ${signers.SignerQuorum} of ${signers.SignerEntries.length}` : "Multisig: no signer list"],
    [f.disableMasterKey, "SHOULD", "Master key disabled (only after the signer list is tested)"],
    [!f.globalFreeze, "MUST", "Not globally frozen"],
    [!a.TransferRate || a.TransferRate === 1e9, "SHOULD", `Transfer fee: ${a.TransferRate ? ((a.TransferRate / 1e9 - 1) * 100).toFixed(3) + "%" : "none"}`],
    [!!remarks.legal_name, "SHOULD", `Legal name on-ledger${remarks.legal_name ? `: ${remarks.legal_name}` : ""}`],
    [!!remarks.prospectus_sha256, "SHOULD", "Prospectus digest on-ledger"],
    [true, "INFO", `Hooks installed: ${hooks.length ? hooks[0].Hooks.length : 0}`],
  ];
  console.log(`Preflight for ${issuer}\n`);
  let blockers = 0;
  for (const [ok, level, msg] of rows) {
    if (!ok && level === "MUST") blockers++;
    console.log(`  ${ok ? "✔" : level === "MUST" ? "✘" : "!"} ${level.padEnd(6)} ${msg}`);
  }
  console.log(blockers ? `\n${blockers} blocker(s): not ready.` : "\nNo blockers.");
  process.exitCode = blockers ? 2 : 0;
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

// release-lock.js: ask the VAULT's Hook to release (or void) a lock
//   node hooks/release-lock.js <ROLE> <lockID>
//   node hooks/release-lock.js ISSUER <lockID> --void
//
// Like EscrowFinish, anyone may ask for a release: the Hook decides. The
// request is an Invoke, a transaction that does nothing but run the Hooks of
// its Destination. --void (issuer only) deletes a lock without paying, after
// the issuer has clawed its tokens back from the vault.
//
// Run first, once, in this order (from examples/, after 01-create-accounts.js):
//   node 10-issuer-setup.js
//   node 12-treasury-line.js
//   node 13-issue-supply.js
//   node 20-onboard-investor.js ALICE --approve
//   node 20-onboard-investor.js BOB --approve
//   node 21-transfer.js TREASURY ALICE 500
//   node 21-transfer.js TREASURY BOB 300
//   node hooks/install-lockbox.js
//   node hooks/lock-tokens.js BOB BOB 20 60  (it prints the lock ID to pass here)
const crypto = require("crypto");
const { connect, wallet, submit, trustLine, BOND_CODE } = require("../lib/xahau");
const { param } = require("./lib");
const { encodeAccountID } = require("xahau");

const RIPPLE_EPOCH = 946684800;
const NAMESPACE = crypto.createHash("sha256").update("lockbox").digest("hex").toUpperCase();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** XFL, the Hooks' 64-bit decimal float, to a JavaScript number. */
function fromXFL(hex) {
  const x = BigInt("0x" + hex);
  if (x === 0n) return 0;
  const mantissa = Number(x & ((1n << 54n) - 1n));
  const exponent = Number((x >> 54n) & 0xffn) - 97;
  const positive = (x >> 62n) & 1n;
  return (positive ? 1 : -1) * mantissa * 10 ** exponent;
}

/** The lock as the Hook stored it: owner, beneficiary, amount, release time. */
async function readLock(client, vault, id) {
  try {
    const { node } = (await client.request({
      command: "ledger_entry",
      hook_state: { account: vault, key: id, namespace_id: NAMESPACE },
      ledger_index: "validated",
    })).result;
    const d = node.HookStateData;
    return {
      owner: encodeAccountID(Buffer.from(d.slice(0, 40), "hex")),
      beneficiary: encodeAccountID(Buffer.from(d.slice(40, 80), "hex")),
      amount: fromXFL(d.slice(80, 96)),
      after: new Date((parseInt(d.slice(96, 104), 16) + RIPPLE_EPOCH) * 1000),
    };
  } catch (err) {
    if (err.data?.error === "entryNotFound") return null;
    throw err;
  }
}

async function main() {
  const role = (process.argv[2] ?? "").toUpperCase();
  const id = (process.argv[3] ?? "").toUpperCase();
  const voiding = process.argv.includes("--void");
  if (!role || !/^[0-9A-F]{64}$/.test(id)) throw new Error("Usage: release-lock.js <ROLE> <lockID> [--void]");
  const client = await connect();
  const vault = wallet("VAULT_SEED").address;
  const issuer = wallet("ISSUER_SEED").address;

  const lock = await readLock(client, vault, id);
  if (lock) console.log(`  lock: ${lock.amount} HBOND for ${lock.beneficiary}, after ${lock.after.toISOString()}`);
  const before = lock && await trustLine(client, lock.beneficiary, issuer, BOND_CODE);

  const { code } = await submit(client, wallet(`${role}_SEED`), {
    TransactionType: "Invoke",
    Destination: vault,
    HookParameters: [param("ID", id), ...(voiding ? [param("OP", Buffer.from("VOID").toString("hex"))] : [])],
  }, `${role.toLowerCase()}: ${voiding ? "void" : "release"} lock ${id.slice(0, 8)}…`);

  // The release is a payment the Hook emits: it lands in a following ledger
  if (code === "tesSUCCESS" && !voiding && lock) {
    for (let i = 0; i < 10; i++) {
      await sleep(2000);
      const now = await trustLine(client, lock.beneficiary, issuer, BOND_CODE);
      if (Number(now.balance) !== Number(before.balance)) {
        console.log(`  beneficiary: ${before.balance} -> ${now.balance} HBOND`);
        break;
      }
    }
  }
  const held = await trustLine(client, vault, issuer, BOND_CODE);
  console.log(`  vault holds ${held?.balance ?? 0} HBOND`);
  await client.disconnect();
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

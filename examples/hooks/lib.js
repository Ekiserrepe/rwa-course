// hooks/lib.js: install and remove Hooks, and encode their parameters
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { calculateHookOn, decodeAccountID } = require("xahau");
const { submit } = require("../lib/xahau");

const hsfOverride = 1; // replace whatever is in the slot
const hsfCollect = 4;  // this Hook may run as a weak stakeholder (collect call)

/** 20-byte currency field: "USD" becomes 12 zero bytes + "USD" + 5 zero bytes. */
function currencyBytes(code) {
  if (code.length === 40) return code.toUpperCase();
  const buf = Buffer.alloc(20);
  buf.write(code, 12, "ascii");
  return buf.toString("hex").toUpperCase();
}
const accountBytes = (address) => Buffer.from(decodeAccountID(address)).toString("hex").toUpperCase();
const u32 = (n) => n.toString(16).padStart(8, "0").toUpperCase();
const param = (name, hexValue) => ({
  HookParameter: { HookParameterName: Buffer.from(name).toString("hex").toUpperCase(), HookParameterValue: hexValue },
});

// HookOn is a bitmap in which a 0 bit means "fire": all zeros fires on every
// transaction type (except SetHook, whose bit works the other way round)
const ALL_TYPES = "0".repeat(64);

/** SetHook with the compiled .wasm from this folder, in slot 1. `on`: a list of types, or "all". */
async function install(client, account, name, { on, params = [], collect = false }) {
  if (collect) {
    // Collect call, part 1: the account agrees to pay for its weak executions
    await submit(client, account, { TransactionType: "AccountSet", SetFlag: 11 }, "asfTshCollect");
  }
  return submit(client, account, {
    TransactionType: "SetHook",
    Hooks: [{
      Hook: {
        CreateCode: fs.readFileSync(path.join(__dirname, `${name}.wasm`)).toString("hex").toUpperCase(),
        HookOn: on === "all" ? ALL_TYPES : calculateHookOn(on),
        HookNamespace: crypto.createHash("sha256").update(name).digest("hex").toUpperCase(),
        HookApiVersion: 0,
        HookParameters: params,
        Flags: hsfOverride | (collect ? hsfCollect : 0), // collect call, part 2
      },
    }],
  }, `install ${name}`);
}

/** Empty slot 1 again. */
const remove = (client, account, label = "remove hook") =>
  submit(client, account, { TransactionType: "SetHook", Hooks: [{ Hook: { CreateCode: "", Flags: hsfOverride } }] }, label);

/** Delete every state entry a Hook keeps in its namespace (the Hook itself stays installed). */
const hsfNSDelete = 2;
const clearState = (client, account, name, label = `clear ${name} state`) =>
  submit(client, account, {
    TransactionType: "SetHook",
    Hooks: [{ Hook: { HookNamespace: crypto.createHash("sha256").update(name).digest("hex").toUpperCase(), Flags: hsfNSDelete } }],
  }, label);

module.exports = { install, remove, clearState, currencyBytes, accountBytes, u32, param };

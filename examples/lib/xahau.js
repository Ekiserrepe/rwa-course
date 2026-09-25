// lib/xahau.js: the few helpers every script in this course shares.
require("dotenv").config();
const { Client, Wallet } = require("xahau");

const NETWORK = process.env.NETWORK || "wss://xahau-test.net";

/** UTF-8 text -> uppercase hex, the encoding every URI, Remark and long currency code uses. */
const toHex = (text) => Buffer.from(text, "utf8").toString("hex").toUpperCase();

/** Hex -> UTF-8 text. */
const fromHex = (hex) => Buffer.from(hex, "hex").toString("utf8");

/**
 * The ledger's currency field is 160 bits. Three-character names (USD, EUR)
 * are written as they are; anything longer must be 40 hex characters.
 *   currencyCode("USD")   -> "USD"
 *   currencyCode("HBOND") -> "48424F4E44000000000000000000000000000000"
 */
function currencyCode(name) {
  if (/^[A-Za-z0-9?!@#$%^&*<>(){}[\]|]{3}$/.test(name)) {
    if (name.toUpperCase() === "XAH") throw new Error("XAH is reserved for the native coin");
    return name;
  }
  if (/^[0-9A-F]{40}$/i.test(name)) return name.toUpperCase();
  const bytes = Buffer.from(name, "utf8");
  if (bytes.length > 20) throw new Error(`"${name}" is longer than 20 bytes`);
  return Buffer.concat([bytes, Buffer.alloc(20 - bytes.length)]).toString("hex").toUpperCase();
}

/** The readable name behind a currency code, for printing. */
function currencyName(code) {
  if (code.length !== 40) return code;
  return Buffer.from(code, "hex").toString("utf8").replace(/\0+$/, "");
}

/** Load a wallet from a seed stored in .env, e.g. wallet("ISSUER_SEED"). */
function wallet(envName) {
  const seed = process.env[envName];
  if (!seed) throw new Error(`${envName} is not set, run 01-create-accounts.js first`);
  return Wallet.fromSeed(seed, { algorithm: "secp256k1" });
}

/** The course's two currencies: the asset token and the stablecoin it settles in. */
const BOND_CODE = currencyCode("HBOND");
const bond = (value) => ({ currency: BOND_CODE, issuer: wallet("ISSUER_SEED").address, value: String(value) });
const usd = (value) => ({ currency: "USD", issuer: wallet("STABLE_SEED").address, value: String(value) });

/** Open a connection; remember to `await client.disconnect()` when done. */
async function connect() {
  const client = new Client(NETWORK);
  await client.connect();
  return client;
}

/**
 * Autofill, sign, submit and wait for validation.
 * Logs the result code and any Hook return strings, and returns the full
 * response. Never throws on a tec code: check `code` yourself.
 */
async function submit(client, signer, tx, label = tx.TransactionType) {
  const prepared = await client.autofill({ Account: signer.address, ...tx });
  const { tx_blob, hash } = signer.sign(prepared);
  const res = await client.submitAndWait(tx_blob);
  const meta = res.result.meta;
  const code = meta.TransactionResult;
  const hooks = (meta.HookExecutions || [])
    .map((h) => fromHex(h.HookExecution.HookReturnString))
    .filter(Boolean);
  console.log(`${code === "tesSUCCESS" ? "✔" : "✘"} ${label}: ${code}${hooks.length ? `  [hook] ${hooks.join(" | ")}` : ""}`);
  return { code, hash, meta, result: res.result };
}

/**
 * The trust line between `account` and `issuer` for one currency, seen from
 * `account`'s side, or null when there is none. `balance` is positive when
 * `account` holds the token.
 */
async function trustLine(client, account, issuer, currency) {
  const res = await client.request({ command: "account_lines", account, peer: issuer, ledger_index: "validated" });
  return res.result.lines.find((l) => l.currency === currency) ?? null;
}

/** Read any ledger object by its ID, or null when it does not exist. */
async function getObject(client, id) {
  try {
    const res = await client.request({ command: "ledger_entry", index: id, ledger_index: "validated" });
    return res.result.node;
  } catch (err) {
    if (err.data?.error === "entryNotFound") return null;
    throw err;
  }
}

module.exports = {
  NETWORK, toHex, fromHex, currencyCode, currencyName, wallet,
  BOND_CODE, bond, usd, connect, submit, trustLine, getObject,
};

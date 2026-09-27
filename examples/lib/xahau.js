// lib/xahau.js: the few helpers every script in this course shares.
const path = require("path");

// examples/, wherever a script is run from: `node hooks/x.js` from examples/
// and `node x.js` from examples/hooks/ must find the same .env.
const EXAMPLES_DIR = path.join(__dirname, "..");
const ENV_FILE = path.join(EXAMPLES_DIR, ".env");
require("dotenv").config({ path: ENV_FILE });
const fs = require("fs");
const BigNumber = require("bignumber.js");
const { Client, Wallet, decodeSeed } = require("xahau");

const NETWORK = process.env.NETWORK || "wss://xahau-test.net";
const TESTNET_ID = 21338;

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

/**
 * A wallet from a seed, with the algorithm the seed itself records: an "sEd…"
 * seed is ed25519, the faucet's "s…" seeds are secp256k1. xahau.js assumes
 * ed25519 unless told otherwise, and the wrong algorithm derives a different
 * account from the same seed.
 */
const fromSeed = (seed) =>
  Wallet.fromSeed(seed, { algorithm: decodeSeed(seed).type === "ed25519" ? "ed25519" : "ecdsa-secp256k1" });

/** Load a wallet from a seed stored in .env, e.g. wallet("ISSUER_SEED"). */
function wallet(envName) {
  const seed = process.env[envName];
  if (!seed) throw new Error(`${envName} is not set, run 01-create-accounts.js first`);
  return fromSeed(seed);
}

/** Write a file only its owner can read (mode 600): for anything that holds seeds. */
function writeSecret(file, text, { append = false } = {}) {
  (append ? fs.appendFileSync : fs.writeFileSync)(file, text, { mode: 0o600 });
  fs.chmodSync(file, 0o600); // `mode` only applies when the file is created
}

/**
 * Money is never a JS number: 1.15 * 100 is 114.99999999999999 in floating
 * point, and 3 * 1.002 is 3.0060000000000002, more digits than a token amount
 * may have. `dec()` does exact decimal arithmetic: dec("1.15").times(100) is 115.
 */
const dec = (value) => new BigNumber(value);

/**
 * A token amount as the ledger takes it: at most 15 significant digits.
 * Round on purpose, in the direction that protects whoever pays:
 *   ROUND_DOWN for what you pay out, ROUND_UP for a SendMax.
 */
const { ROUND_DOWN, ROUND_UP } = BigNumber;
const tokenValue = (value, rounding = ROUND_DOWN) => dec(value).precision(15, rounding).toFixed();

/** The course's two currencies: the asset token and the stablecoin it settles in. */
const BOND_CODE = currencyCode("HBOND");
const bond = (value) => ({ currency: BOND_CODE, issuer: wallet("ISSUER_SEED").address, value: tokenValue(value) });
const usd = (value) => ({ currency: "USD", issuer: wallet("STABLE_SEED").address, value: tokenValue(value) });

/**
 * Open a connection; remember to `await client.disconnect()` when done.
 * Refuses any network but testnet unless ALLOW_MAINNET=1 is set: some scripts
 * set flags that can never be undone. `readOnly` scripts may connect anywhere.
 */
async function connect({ readOnly = false } = {}) {
  const client = new Client(NETWORK);
  await client.connect();
  const { network_id: id } = (await client.request({ command: "server_info" })).result.info;
  if (id !== TESTNET_ID && !readOnly && process.env.ALLOW_MAINNET !== "1") {
    await client.disconnect();
    throw new Error(`${NETWORK} is NetworkID ${id}, not testnet (${TESTNET_ID}). Set ALLOW_MAINNET=1 only if you mean it.`);
  }
  return client;
}

/**
 * Autofill, sign, submit and wait for validation.
 * Logs the result code and any Hook return strings, and returns the full
 * response. Any result but tesSUCCESS sets the script's exit code to 1,
 * unless it is listed in `expect` (a refusal the lesson demonstrates).
 * `onSigned({ hash, LastLedgerSequence })` runs before anything is sent.
 */
async function submit(client, signer, tx, label = tx.TransactionType, { expect = [], onSigned } = {}) {
  const prepared = await client.autofill({ Account: signer.address, ...tx });
  const { tx_blob, hash } = signer.sign(prepared);
  if (onSigned) await onSigned({ hash, LastLedgerSequence: prepared.LastLedgerSequence });
  const res = await client.submitAndWait(tx_blob);
  const meta = res.result.meta;
  const code = meta.TransactionResult;
  const hooks = (meta.HookExecutions || [])
    // A Hook returns a C string: drop its terminating NUL before printing
    .map((h) => fromHex(h.HookExecution.HookReturnString).replace(/\0+$/, ""))
    .filter(Boolean);
  console.log(`${code === "tesSUCCESS" ? "✔" : "✘"} ${label}: ${code}${hooks.length ? `  [hook] ${hooks.join(" | ")}` : ""}`);
  if (code !== "tesSUCCESS" && !expect.includes(code)) process.exitCode = 1;
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

/**
 * How much of a token exists, from gateway_balances: `outside` the hot
 * wallets (investors) and `inHotwallets` (the treasury). Balances on FROZEN
 * lines are not in `obligations`: the node lists them apart, in
 * `frozen_balances`, so they are added back here. Forgetting them sizes a
 * redemption too small, or declares a supply retired while frozen holders
 * still hold tokens.
 */
async function supply(client, issuer, currency, hotwallets = []) {
  const gb = (await client.request({ command: "gateway_balances", account: issuer, hotwallet: hotwallets, ledger_index: "validated" })).result;
  let outside = dec(gb.obligations?.[currency] ?? 0);
  let inHotwallets = dec(0);
  for (const amounts of Object.values(gb.balances ?? {})) {
    for (const a of amounts) if (a.currency === currency) inHotwallets = inHotwallets.plus(a.value);
  }
  for (const [account, amounts] of Object.entries(gb.frozen_balances ?? {})) {
    for (const a of amounts) {
      if (a.currency !== currency) continue;
      if (hotwallets.includes(account)) inHotwallets = inHotwallets.plus(a.value);
      else outside = outside.plus(a.value);
    }
  }
  return { outside, inHotwallets, total: outside.plus(inHotwallets) };
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
  EXAMPLES_DIR, ENV_FILE, NETWORK, toHex, fromHex, currencyCode, currencyName, fromSeed, wallet,
  writeSecret, dec, tokenValue, ROUND_DOWN, ROUND_UP,
  BOND_CODE, bond, usd, connect, submit, trustLine, getObject, supply,
};

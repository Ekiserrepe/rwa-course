# Course examples

Runnable scripts for **Learn RWA**. Every one was run against Xahau testnet, and
`npm run verify` runs them all again. The course lessons display these files verbatim.

```sh
npm install
node 01-create-accounts.js     # ~6 minutes: the faucet allows ~1 account/minute
```

Seeds go to `.env` (git-ignored, readable only by you: mode 600; a previous one is
kept as `.env.bak`). **Testnet only:** `lib/xahau.js` refuses any other network unless
`ALLOW_MAINNET=1` is set, because some scripts set flags that can never be undone.
Read-only `90-preflight.js` runs anywhere.

Every script prints `✔`/`✘` per transaction and exits with code 1 when a transaction
fails or an error stops it, with a one-line message instead of a stack trace. A refusal
the lesson demonstrates on purpose (DepositAuth refusing BOB, an escrow of HBOND…) is
still printed with `✘` but doesn't change the exit code.

Amounts are exact decimals (`dec()` in `lib/xahau.js`, from bignumber.js), never
JavaScript floating point, and rounded explicitly: down for what is paid out. Roles are the names in `.env`:
`ISSUER`, `TREASURY`, `ALICE`, `BOB`, `CAROL`, `STABLE`, plus `CFO`, `COO` and `COUNSEL`
(added by `70-multisig-setup.js`) and `VAULT` (added by `hooks/install-lockbox.js`).

Run the scripts in lesson order. Each one's header lists what must run before it
("Run first"), and every script uses `examples/.env` whichever folder you run it from.

| Script | Module | What it does |
|---|---|---|
| `lib/xahau.js` | 0 | connect, wallet, toHex/fromHex, currency codes, `bond()`/`usd()` amounts, submit, trustLine, getObject |
| `01-create-accounts.js` | 0 | the six roles from the faucet |
| `00-wallet-basics.js` · `00-anatomy-of-a-transaction.js` · `00-look-around.js` | 0 | keys and reserves, one transaction step by step, free reads |
| `10-issuer-setup.js` | 2 | RequireAuth, clawback (17), DefaultRipple, Domain, TickSize, read back |
| `11-currency-code.js` | 2 | 3-char vs 40-hex currency codes |
| `12-treasury-line.js` · `13-issue-supply.js` | 2 | request + authorise a line; issue the supply |
| `14-supply-report.js` · `15-issuer-profile.js` | 2 | gateway_balances and the cap table; on-ledger fact sheet |
| `20-onboard-investor.js` · `21-transfer.js` | 3 | KYC request/approval; transfers between roles |
| `22-freeze.js` · `23-global-freeze.js` | 3 | freeze, deep freeze, global freeze |
| `24-clawback.js` · `25-deposit-auth.js` | 3 | clawback; DepositAuth + DepositPreauth |
| `30-stablecoin-setup.js` | 4 | a USD issuer and funded investors |
| `31-primary-offer.js` · `32-order-book.js` | 4 | the offering as a DEX offer; the book |
| `33-subscribe.js` · `34-sell-offer.js` | 4 | Fill or Kill buys; secondary asks and cancels |
| `40-holder-snapshot.js` · `41-pay-coupon.js` | 5 | record date; idempotent coupon run, with a journal for payments in flight |
| `42-coupon-reserve.js` · `43-release-escrow.js` | 5 | USD reserve in escrow (and why HBOND can't be escrowed) |
| `44-redemption-window.js` · `45-redeem.js` · `46-retire-supply.js` | 5 | close the primary offer, atomic redemption at maturity, supply to zero |
| `50-document-digest.js` · `51-mint-deed.js` | 6 | SHA-256 of a document; the deed as a URIToken |
| `52-deed-remarks.js` · `53-verify-deed.js` | 6 | immutable/mutable facts; verify token vs document |
| `54-link-deed.js` · `55-sell-deed.js` | 6 | deed ↔ bond links; DvP deed sale |
| `60-publish-nav.js` · `61-read-nav.js` | 7 | OracleSet; ledger_entry + get_aggregate_price, stale check |
| `70-multisig-setup.js` · `71-multisig-freeze.js` · `72-disable-master.js` | 8 | 2-of-3 signer list; a multisigned freeze; disabling a master key, on a scratch account |
| `hooks/*` | 9 | `probe`, `subscription_desk`, `holding_cap`, `lockbox` (C + Wasm + installers), `build.sh` |
| `capstone/run.js` · `capstone/term-sheet.json` | 10 | the whole bond, eleven checked phases |
| `90-preflight.js` | 11 | read-only launch check of an issuer, and of the amendments the course relies on |
| `verify/run-all.mjs` | all | `npm run verify`: runs everything on testnet and checks each result |

Typical order (what `npm run verify` does):

```sh
node 10-issuer-setup.js && node 12-treasury-line.js && node 13-issue-supply.js
node 20-onboard-investor.js ALICE --approve
node 20-onboard-investor.js BOB --approve
node 20-onboard-investor.js CAROL
node 21-transfer.js TREASURY ALICE 500
node 30-stablecoin-setup.js && node 31-primary-offer.js && node 33-subscribe.js ALICE 20
node 40-holder-snapshot.js --save && node 41-pay-coupon.js 1.25
node capstone/run.js
```

`10-issuer-setup.js` only works on a fresh issuer: the flags it sets need an empty owner
directory (no trust line, no object of its own). To start over, run
`01-create-accounts.js` again.

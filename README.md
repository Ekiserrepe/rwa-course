# ⬡ Learn RWA

A free, open-source, hands-on course on **tokenizing real-world assets (RWA)** on the
[Xahau Network](https://xahau.network): issued tokens with KYC-gated trust lines, freeze,
deep freeze and clawback, stablecoin settlement on the DEX, coupons, escrowed reserves,
redemption at maturity, deeds as URITokens, NAV oracles, multisig governance and
compliance Hooks, ending with a tokenized bond run from term sheet to maturity.

**Read it at [rwa-course.inftf.org](https://rwa-course.inftf.org).**

Built on the design and app of [Learn Xahau](https://github.com/INFTF/xahau-course) and
Learn URITokens, so the three read as one family. The Xahau courses are listed at
[xahau.network/learn](https://xahau.network/learn/).

![License](https://img.shields.io/badge/license-MIT-green)
![Language](https://img.shields.io/badge/language-EN-blue)

## Curriculum

| # | Module | Covers |
|---|---|---|
| 0 | Start here | Blockchain in plain words, accounts and keys, transactions, ledger objects and reserves, setup, a glossary |
| 1 | RWA fundamentals | Asset, claim and token; the legal wrapper; IOU vs URIToken; roles and cold/hot accounts; what the ledger can and can't enforce |
| 2 | Issuing a fungible token | Issuer flags (and the order they must be set in), currency codes, trust lines, issuing supply, reading supply, an on-ledger fact sheet |
| 3 | Compliance controls | KYC with authorised trust lines, freeze, deep freeze, global freeze, clawback, DepositAuth |
| 4 | Markets | A stablecoin for settlement, the primary sale as a DEX offer, Fill or Kill, KYC at the exchange, secondary trading |
| 5 | Asset servicing | Record-date snapshots, idempotent coupon runs, escrowed coupon reserves, an atomic redemption window |
| 6 | Unique assets | Deeds as URITokens, SHA-256 digests, immutable Remarks, verification, linking deed and bond, a DvP deed sale |
| 7 | Oracles | Publishing NAV with `OracleSet`, reading it safely, disclosure and proof of reserves |
| 8 | Keys and governance | Master and regular keys, a 2-of-3 signer list, multisigned actions, incident playbook |
| 9 | Hooks for compliance | What an issuer's Hook can and can't stop, a subscription desk, a holding cap that freezes, a lockbox for time locks that keeps clawback |
| 10 | Capstone | Harbor Bond 2030: eleven checked phases from term sheet to a fully redeemed bond |
| 11 | Production | Mainnet, the legal questions that change your code, operations, the launch checklist |

No blockchain or finance knowledge is assumed. Every module opens with the new
words it uses, a glossary defines every term, every lesson links to the matching
pages of the [Xahau documentation](https://docs.xahau.network/), and every module
ends with a short self-check. **Not legal, tax or investment advice.**

## Runnable examples

`examples/` holds every script the lessons show. **The lessons read these files at
build time** (`example('10-issuer-setup.js')`), so what you read is exactly what you run.
They need Node.js 18 or later and run against Xahau testnet only.

```sh
cd examples
npm install
node 01-create-accounts.js   # six funded testnet accounts → examples/.env (~6 minutes)
node 10-issuer-setup.js
```

Run the scripts in lesson order: each one's header lists the scripts that must run
before it. They all read and write `examples/.env`, whichever folder you run them from.
See [`examples/README.md`](examples/README.md) for the full list.

### Checking the course still works

```sh
cd examples
npm run verify     # 6 fresh testnet accounts, runs every script, checks each result (~25 min)
```

`verify/run-all.mjs` runs all 95 checks in lesson order and checks each output against
what its lesson says (for example: CAROL's order is refused with `tecNO_AUTH`, the
coupon rerun pays nobody, the holding-cap Hook freezes the receiver). The exit code is
the number of failed checks; the log goes to `verify/last-run.log`. A weekly GitHub
Action runs it too.

## Xahau specifics worth knowing

Behaviour that tutorials and docs don't make obvious, each covered in its lesson:

- **`asfAllowTrustLineClawback` is 17 on Xahau, not 16.** 16 is `asfDisallowIncomingRemit`: code copied from XRP Ledger tutorials sets the wrong flag without any error.
- **RequireAuth and clawback must be set before any trust line to the issuer exists**, even one holding nothing (`tecOWNERS`, even with `OwnerCount` 0). A line only disappears once it is back to its defaults: limit 0 *and* `tfSetNoRipple`. Clawback also can't be enabled after NoFreeze.
- **NoFreeze doesn't disable global freeze, it makes it permanent**: the issuer can still turn it on, but never off again.
- **A token whose issuer has clawback can't be escrowed** (`tecNO_PERMISSION`). For lock-ups, deliver late, freeze until a date, or hold the tokens in a vault account whose Hook releases them on time while clawback still reaches them (Module 9).
- **An issuer's Hook can't veto transfers between holders**: it is only a weak stakeholder, not asked at all, or (with a collect call) run afterwards with its rollback ignored. A Hook on an account the issuer runs is a strong stakeholder and can refuse.
- A regular freeze stops a holder sending but **not receiving**; a deep freeze stops both. In every freeze the holder can still pay the issuer, and the issuer can still pay them.
- An unapproved account (RequireAuth) can't even place a resting DEX order: `tecNO_AUTH`.
- **Redeem through the DEX, not with two payments**: tokens back and principal out as separate transactions aren't atomic, and a short treasury leaves the holder with nothing (`tecPATH_PARTIAL`).
- With a **`TransferRate`**, a payment between two holders without a `SendMax` fails with `tecPATH_PARTIAL`; on the DEX the seller pays the fee.
- An issuer Hook needs **`OfferCreate` in `HookOn`** as well as `Payment`, or it never runs on DEX trades of its token.
- **When a transaction fails, everything its Hooks emitted is discarded**: a Hook that answered "accepted" delivers nothing if the payment itself fails.
- Building Hooks in C: `etxn_details` needs a buffer of at least **116 bytes** (138 with a callback), hook-cleaner keeps only `hook()`, so helpers must be inlined, and `-mcpu=mvp` keeps newer WebAssembly features the Hooks VM rejects out of the build.
- Selling a URIToken for an IOU creates the seller's trust line for that IOU automatically.
- `get_aggregate_price` and `OracleSet` work on Xahau; `LastUpdateTime` is Unix time, not ledger time.

## Development

```sh
npm install
npm run dev      # regenerates course data, serves on :3000
npm test         # data-pipeline smoke tests
npm run lint
npm run build
npm run check-links   # every external link in the course still answers 200
```

Same stack as Learn Xahau: React 18 + Vite + Tailwind, no backend. Modules load
lazily; `scripts/build-course-data.mjs` generates the manifest, the search index,
the sitemap and the `/examples` snapshot. Never edit `src/data/generated/` by hand.

The site is English-only for now. The i18n plumbing is intact: add a locale in
`src/data/locales.js`, its labels in `src/data/i18n.js` and the translated
strings next to each `en` key, and the language picker appears on its own.

## Deployment

The site is published at [rwa-course.inftf.org](https://rwa-course.inftf.org). That address lives in
one place, `SITE_URL` in `site.config.js`; the canonical and social links,
`robots.txt`, `sitemap.xml`, Vite's `base` and GitHub Pages' `CNAME` are all
derived from it at build time. To move the course (to a `xahau.network`
subdomain, say), change that line, or set a `SITE_URL` repository variable,
which the deploy workflow passes to the build, then point the new domain's DNS
at GitHub Pages.

To publish: point the domain's DNS at GitHub Pages (a `CNAME` record to
`<owner>.github.io`), set **Settings → Pages → Source** to *GitHub Actions*, and run
the *Deploy to GitHub Pages* workflow. It is manual-trigger only; uncomment its `push`
trigger to deploy on every push to `main`. The *CI* workflow lints, tests and builds
every push, and *Verify examples on testnet* runs the whole course against testnet
every Monday.

## Adding a module

See [`docs/ADDING_MODULES.md`](docs/ADDING_MODULES.md).

## License

MIT. Use freely for education and community building.

## Credits

Course app and design from [Learn Xahau](https://learnxahau.inftf.org) by INFTF, via
Learn URITokens.

# ⬡ Learn RWA

A free, open-source, hands-on course on **tokenizing real-world assets (RWA)** on the
[Xahau Network](https://xahau.network): issued tokens with KYC-gated trust lines, freeze,
deep freeze and clawback, stablecoin settlement on the DEX, coupons, escrowed reserves,
redemption at maturity, deeds as URITokens, NAV oracles, multisig governance and
compliance Hooks, ending with a tokenized bond run from term sheet to maturity.

Built on the design and app of [Learn Xahau](https://github.com/INFTF/xahau-course) and
[Learn URITokens](https://github.com/Ekiserrepe/uritoken-course), so the three read as one family.

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
| 9 | Hooks for compliance | What an issuer's Hook can and can't stop, a subscription desk, a holding cap that freezes |
| 10 | Capstone | Harbor Bond 2030: eleven checked phases from term sheet to a fully redeemed bond |
| 11 | Production | Mainnet, the legal questions that change your code, operations, the launch checklist |

No blockchain or finance knowledge is assumed. Every module opens with the new
words it uses, a glossary defines every term, every lesson links to the matching
pages of the [Xahau documentation](https://docs.xahau.network/), and every module
ends with a short self-check. **Not legal, tax or investment advice.**

## Runnable examples

`examples/` holds every script the lessons show. **The lessons read these files at
build time** (`example('10-issuer-setup.js')`), so what you read is exactly what you run.

```sh
cd examples
npm install
node 01-create-accounts.js   # six funded testnet accounts → .env (~6 minutes)
node 10-issuer-setup.js
```

See [`examples/README.md`](examples/README.md) for the full list.

### Checking the course still works

```sh
cd examples
npm run verify     # 6 fresh testnet accounts, runs every script, checks each result
```

`verify/run-all.mjs` runs all 81 checks in lesson order and checks each output against
what its lesson says (for example: CAROL's order is refused with `tecNO_AUTH`, the
coupon rerun pays nobody, the holding-cap Hook freezes the receiver). The exit code is
the number of failed checks; the log goes to `verify/last-run.log`. A weekly GitHub
Action runs it too.

## Findings worth knowing

Things the testnet runs showed that tutorials and docs don't make obvious. Each one is
written up in the relevant lesson:

- **`asfAllowTrustLineClawback` is 17 on Xahau, not 16.** 16 is `asfDisallowIncomingRemit`; setting it "succeeds" and enables nothing you wanted.
- Clawback can only be enabled while the issuer **owns no ledger objects at all** (no trust lines, offers or escrows) and hasn't set NoFreeze: after the first trust line, `tecOWNERS`, even with `OwnerCount` 0.
- **NoFreeze doesn't disable global freeze, it makes it permanent**: the issuer can still turn it on, but never off again.
- **An issuer with clawback enabled can't have its token escrowed** (`tecNO_PERMISSION`): xahaud refuses locked token balances for such issuers. Choose clawback or token lock-ups before the first holder exists.
- An issuer's Hook is only a **weak** stakeholder of holder-to-holder payments of its token: it isn't asked, or (with collect call) runs afterwards and its rollback is ignored. Hooks can't veto secondary transfers of an IOU.
- A regular freeze stops a holder sending but **not receiving**; a deep freeze stops both. In every freeze the holder can still pay the issuer, and the issuer can still pay them.
- An unapproved account (RequireAuth) can't even place a resting DEX order: `tecNO_AUTH`.
- Redeeming with two payments (tokens back, then principal) is **not atomic**: our first design left a holder with nothing when the treasury was short (`tecPATH_PARTIAL`). A DEX redemption window fixes it.
- With a **`TransferRate`**, a payment between two holders without a `SendMax` fails with `tecPATH_PARTIAL`; on the DEX the seller pays the fee.
- An issuer Hook installed with `HookOn: Payment` **never runs on DEX trades** of its token. `OfferCreate` must be in `HookOn` too.
- `etxn_details` refuses a buffer shorter than **116 bytes** (138 with a callback): emitting a hand-built `TrustSet` failed with `EMISSION_FAILURE` until we gave it 116.
- Selling a URIToken for an IOU created the seller's trust line for that IOU automatically.
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

The site is published at <https://rwa-course.inftf.org>. That address lives in
one place, `SITE_URL` in `site.config.js`; the canonical and social links,
`robots.txt`, `sitemap.xml`, Vite's `base` and GitHub Pages' `CNAME` are all
derived from it at build time. To move the course (to a `xahau.network`
subdomain, say), change that line, or set a `SITE_URL` repository variable,
which the deploy workflow passes to the build, then point the new domain's DNS
at GitHub Pages. The Pages workflow in `.github/workflows/deploy.yml` is
manual-trigger only.

## Adding a module

See [`docs/ADDING_MODULES.md`](docs/ADDING_MODULES.md).

## License

MIT. Use freely for education and community building.

## Credits

Course app and design from [Learn Xahau](https://learnxahau.inftf.org) by INFTF, via
[Learn URITokens](https://github.com/Ekiserrepe/uritoken-course).

# ⬡ Learn RWA

A free, open-source, hands-on course on **tokenizing real-world assets (RWA)** on the
[Xahau Network](https://xahau.network): issued tokens with KYC-gated trust lines, freeze,
deep freeze and clawback, stablecoin settlement on the DEX, coupons, escrowed reserves,
redemption at maturity, deeds as URITokens, NAV oracles, multisig governance and
compliance Hooks, ending with a tokenized bond run from term sheet to maturity.

**Read it at [learn.xahau.network/rwa-course](https://learn.xahau.network/rwa-course/).**

The Xahau courses are listed at
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

## Adding a module

See [`docs/ADDING_MODULES.md`](docs/ADDING_MODULES.md).

## License

MIT. Use freely for education and community building.

## Credits

Course by INFTF.

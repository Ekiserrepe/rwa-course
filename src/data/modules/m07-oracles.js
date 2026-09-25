import { example } from '../example-code.js'

export default {
  id: "m7",
  icon: "📡",
  title: { en: "Oracles: Publishing and Reading NAV" },
  lessons: [
    {
      id: "m7l1",
      title: { en: "The Oracle Problem, and Publishing NAV" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **Oracle** | Someone who publishes an off-ledger fact, like a price, on the ledger. |
| **NAV** | Net asset value: what one unit of a fund or bond is worth, calculated by its administrator. |
| **Scale** | How many decimal places a published price has: 10037 with Scale 2 is 100.37. |
| **Stale price** | A price older than you are willing to rely on. |

Any other term: see the [Glossary](?m=0&l=9).

The ledger knows exactly who holds HBOND. It has no idea what HBOND is **worth**: that depends on the warehouse, interest rates and the SPV's accounts, all off the ledger. Getting that number onto the ledger means **trusting whoever puts it there**. That's the oracle problem, and it has no technical solution, only good practice: a known publisher, a clear method, frequent updates, and readers who refuse stale data.

### Xahau's price oracle

Xahau has a native price-oracle object (the \`PriceOracle\` amendment, live on mainnet). The publisher sends \`OracleSet\`:

\`\`\`json
{
  "TransactionType": "OracleSet",
  "Account": "<ISSUER>",
  "OracleDocumentID": 1,
  "Provider": "<hex of 'harbor-bond-administrator'>",
  "AssetClass": "<hex of 'bond'>",
  "URI": "<hex of 'https://harbor-bond.example/nav'>",
  "LastUpdateTime": 1789961496,
  "PriceDataSeries": [
    { "PriceData": { "BaseAsset": "48424F4E44…", "QuoteAsset": "USD", "AssetPrice": "2735", "Scale": 2 } }
  ]
}
\`\`\`

- \`OracleDocumentID\` tells apart several oracles owned by the same account. Sending \`OracleSet\` again with the same ID **updates** it.
- \`Provider\` and \`AssetClass\` describe who publishes and what kind of asset (both hex).
- \`LastUpdateTime\` is **Unix** time (not ledger time!), and must be close to the ledger's own clock: an update stamped one hour in the past failed on testnet with \`tecINVALID_UPDATE_TIME\`.
- \`Provider\` and \`AssetClass\` are needed when the oracle is created; later updates may leave them out.
- Prices are **integers with a scale**: \`AssetPrice\` is a hex string, so 100.37 is \`10037\` → \`"2735"\` with \`Scale: 2\`.
- One oracle can carry several pairs (\`HBOND/USD\`, \`HBOND/EUR\`…).

\`\`\`
✔ publish NAV 100.37 USD: tesSUCCESS
\`\`\`

The oracle is an object owned by the publisher: it costs owner reserve, and \`OracleDelete\` removes it.

### Who should publish

In the course the ISSUER publishes, to keep the account count down. In production the **fund administrator** (an independent party that calculates NAV) should publish from **its own** account. Readers then trust the administrator's address, not the issuer's say-so about itself.

### In the Xahau docs

- [OracleSet](https://docs.xahau.network/protocol-reference/transactions/transaction-types/oracleset/)
- [The Oracle object](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/oracle/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/60-publish-nav.js" },
          language: "javascript",
          code: example("60-publish-nav.js"),
        },
      ],
      slides: [
        {
          title: { en: "The Oracle Problem" },
          content: { en: "The ledger knows who holds\nnot what it's worth\n\nSomeone must publish, and be trusted" },
          visual: "📡",
        },
        {
          title: { en: "OracleSet" },
          content: { en: "Document ID · Provider · AssetClass\nLastUpdateTime (Unix, near now)\nAssetPrice (hex) + Scale\n100.37 = 10037, Scale 2" },
          visual: "🛰️",
        },
      ],
    },
    {
      id: "m7l2",
      title: { en: "Reading a Price Safely" },
      theory: {
        en: `A price you read from the ledger is a claim by its publisher at a moment in time. Code that uses it must check **who** and **when** before **how much**.

### Two ways to read

**\`ledger_entry\` with \`oracle\`** returns the object itself, by publisher and document ID:

\`\`\`json
{ "command": "ledger_entry", "oracle": { "account": "<publisher>", "oracle_document_id": 1 } }
\`\`\`

**\`get_aggregate_price\`** combines several oracles for one pair and returns the mean, the median and the spread, which is how you should read a price when several independent publishers exist:

\`\`\`json
{ "command": "get_aggregate_price", "base_asset": "48424F4E44…", "quote_asset": "USD",
  "oracles": [{ "account": "<publisher>", "oracle_document_id": 1 }] }
\`\`\`

Both work on Xahau testnet:

\`\`\`
Oracle of rN4AAuFksWwA2fwV3mgRNVNirMKqfRRpZT
  provider: harbor-bond-administrator, class: bond
  updated 7s ago (2026-09-21T05:40:38.000Z)
  HBOND/USD = 100.37
  aggregate of 1 oracle(s): median 100.37
\`\`\`

### Refuse stale data

NAV is typically published daily. \`61-read-nav.js\` takes a maximum age and, if the price is older, says so loudly and exits with code 2:

\`\`\`
  ✘ STALE: older than 1s, do not price anything with it
\`\`\`

Anything that acts on a price (a margin call, a collateral check, a subscription at NAV) should refuse to act on a stale one. A missing update is a signal: the administrator is down, or something is being hidden.

### Checklist for consumers

1. Pin the **publisher's address**, never trust an oracle just because its \`Provider\` text looks right.
2. Check \`LastUpdateTime\` against your maximum age.
3. Check the **base and quote assets** are the exact codes you expect (\`HBOND\` from this issuer, \`USD\`).
4. With several publishers, use the **median** and watch the spread.

### In the Xahau docs

- [Request methods (ledger_entry)](https://docs.xahau.network/features/http-websocket-apis/public-api-methods/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/61-read-nav.js" },
          language: "javascript",
          code: example("61-read-nav.js"),
        },
      ],
      slides: [
        {
          title: { en: "Read Safely" },
          content: { en: "Who: pin the publisher address\nWhen: refuse stale prices\nWhat: exact base/quote codes\nMany publishers: use the median" },
          visual: "🧪",
        },
      ],
    },
    {
      id: "m7l3",
      title: { en: "Disclosure and Proof of Reserves" },
      theory: {
        en: `NAV is one number. Investors in an RWA want more: evidence that the backing exists. The ledger can't prove a warehouse exists, but it can make **every claim the issuer makes checkable and permanent**.

### What each tool proves

| Claim | Tool | What a reader can verify |
|---|---|---|
| "10,000 HBOND exist, 800 sold" | \`gateway_balances\` | Exactly, from the ledger (Module 2) |
| "The next coupon is set aside" | USD escrow | Amount locked and release date (Module 5) |
| "The bond is secured by this warehouse" | Deed URIToken + linking remarks | Which deed, which document, that it wasn't swapped (Module 6) |
| "NAV is 100.37" | Oracle | Who said it and when (lesson 1) |
| "An auditor checked our accounts" | Remark with the audit report's SHA-256 | That the report you have is the one published |
| "Our cash is at Bank X" | Nothing on-ledger | Only the custodian's statement |

### Attestations as fingerprints

The pattern from the prospectus and the deed works for any periodic report: the auditor's opinion, the custodian's statement, the valuer's report. Publish the file wherever you like, and write its SHA-256 as a remark on the issuer account (\`audit_2026_sha256\`), immutable. Months later, nobody can claim a different report was published, including the issuer.

### When the reserve is itself on the ledger

For a tokenized money-market fund or a stablecoin-backed product, the backing may be tokens on the same ledger (say, USD held by the fund's custody account). Then proof of reserves is exact: compare the custody account's balance with the fund token's obligations, both from \`account_lines\` and \`gateway_balances\`, at the same ledger index. Publishing that comparison is a script, not a promise.

### In the Xahau docs

- [SetRemarks](https://docs.xahau.network/protocol-reference/transactions/transaction-types/setremarks/)
- [Escrow](https://docs.xahau.network/features/network-features/escrow/)`,
      },
      slides: [
        {
          title: { en: "Make Claims Checkable" },
          content: { en: "Supply → gateway_balances\nCoupon reserve → escrow\nCollateral → deed + Digest\nNAV → oracle\nReports → SHA-256 in Remarks" },
          visual: "🔍",
        },
      ],
    },
  ],
}

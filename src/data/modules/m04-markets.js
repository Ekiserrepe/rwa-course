import { example } from '../example-code.js'

export default {
  id: "m4",
  icon: "📈",
  title: { en: "Markets: Stablecoin Settlement and the DEX" },
  lessons: [
    {
      id: "m4l1",
      title: { en: "A Settlement Currency: the Stablecoin" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **Stablecoin** | An issued token redeemable 1:1 for a fiat currency, held by its issuer in a bank or in short-term government bonds. |
| **Primary market** | Investors buy from the issuer (the offering). |
| **Secondary market** | Investors trade with each other afterwards. |
| **Order book** | All open offers for one currency pair, best price first. |
| **Quality** | An offer's price: what it asks divided by what it gives. |
| **DvP (delivery versus payment)** | The asset and the payment change hands in one step, or neither does. |
| **Fill or Kill** | An order flag: fill completely now, or do nothing at all. |

Any other term: see the [Glossary](?m=0&l=9).

A bond priced in XAH would change value every time XAH moves, which no bond investor wants. RWAs settle in a **stablecoin**: an issued token worth one dollar (or euro), redeemable with its issuer.

### The course's stand-in

\`30-stablecoin-setup.js\` makes the STABLE account a minimal stablecoin issuer:

1. \`DefaultRipple\` on, so USD moves between holders. No RequireAuth: anyone may hold it.
2. The TREASURY and the three investors open USD trust lines.
3. STABLE pays each investor 10,000 USD, as if they had wired dollars to it.

\`\`\`
✔ stable -> alice: 10,000 USD: tesSUCCESS
✔ stable -> bob: 10,000 USD: tesSUCCESS
✔ stable -> carol: 10,000 USD: tesSUCCESS
  ALICE: 10000 USD
  BOB: 10000 USD
  CAROL: 10000 USD
\`\`\`

### Choosing a real one

On mainnet you pick an existing, regulated stablecoin, and that choice carries risk you should state in your terms:

- **Issuer risk**: the stablecoin is a claim on its issuer. If it fails, your investors' cash does too.
- **Its controls apply to you**: if the stablecoin issuer can freeze or claw back (many can), it can freeze your treasury's cash.
- **Identity**: "USD" alone means nothing. Always pin \`{ currency, issuer }\`, exactly as your investors must pin HBOND's issuer (Module 2).

### In the Xahau docs

- [Currency formats](https://docs.xahau.network/protocol-reference/data-types/currency-formats/)
- [TrustSet](https://docs.xahau.network/protocol-reference/transactions/transaction-types/trustset/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/30-stablecoin-setup.js" },
          language: "javascript",
          code: example("30-stablecoin-setup.js"),
        },
      ],
      slides: [
        {
          title: { en: "Settle in a Stablecoin" },
          content: { en: "Prices, coupons, principal: all in USD\nUSD = { currency, issuer }\n\nIts issuer's risk and controls\nbecome yours" },
          visual: "💵",
        },
      ],
    },
    {
      id: "m4l2",
      title: { en: "The Primary Sale as a DEX Offer" },
      theory: {
        en: `The simplest offering on Xahau is **one transaction**: the treasury places an offer on the built-in exchange.

\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "<TREASURY>",
  "TakerGets": { "currency": "48424F4E44…", "issuer": "<ISSUER>", "value": "5000" },
  "TakerPays": { "currency": "USD", "issuer": "<STABLE>", "value": "500000" }
}
\`\`\`

"Taker" is whoever takes the offer later. So \`TakerGets\` is what the treasury **gives** (5,000 HBOND), and \`TakerPays\` is what it wants **in return** (500,000 USD): a price of 100 USD per HBOND. The offer sits on the order book until investors fill it, in whole or in parts.

### Reading the book

\`book_offers\` lists every open offer for a pair, best price first. From a buyer's point of view:

\`\`\`json
{ "command": "book_offers",
  "taker_gets": { "currency": "48424F4E44…", "issuer": "<ISSUER>" },
  "taker_pays": { "currency": "USD", "issuer": "<STABLE>" } }
\`\`\`

Each offer has a \`quality\`, \`TakerPays / TakerGets\` in the offer's own units: here USD per HBOND.

\`\`\`
✔ offer 5000 HBOND at 100 USD: tesSUCCESS
  100.00 USD  x 5000 HBOND  from TREASURY
\`\`\`

### Why an offer, and not "send us money"?

With a plain "pay us and we'll send you tokens" process, there's a moment when the investor has paid and doesn't have the tokens yet, and the issuer has to be trusted to deliver. An offer on the DEX is **delivery versus payment**: the investor's USD and the treasury's HBOND swap in the same transaction, or nothing happens. Module 9 shows how a Hook can give the "pay us" flow the same guarantee.

### The offer only sells what the treasury holds

An offer is not escrowed: the tokens stay in the treasury. If the treasury's balance drops (it paid someone), the offer is **partly unfunded** and only the funded part can be taken. \`book_offers\` reports that as \`taker_gets_funded\`, which \`32-order-book.js\` prints.

### In the Xahau docs

- [Offers and the DEX](https://docs.xahau.network/features/network-features/offer/)
- [OfferCreate](https://docs.xahau.network/protocol-reference/transactions/transaction-types/offercreate/)
- [The Offer object](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/offer/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/31-primary-offer.js" },
          language: "javascript",
          code: example("31-primary-offer.js"),
        },
        {
          title: { en: "examples/32-order-book.js" },
          language: "javascript",
          code: example("32-order-book.js"),
        },
      ],
      slides: [
        {
          title: { en: "One Offer = One Offering" },
          content: { en: "TakerGets 5000 HBOND (treasury gives)\nTakerPays 500000 USD (treasury wants)\n= 100 USD per HBOND\n\nquality = pays / gets" },
          visual: "📖",
        },
      ],
    },
    {
      id: "m4l3",
      title: { en: "Investors Buy: Fill or Kill, and KYC at the Door" },
      theory: {
        en: `An investor buys by placing the **opposite** offer. When it meets the treasury's, they cross immediately:

\`\`\`json
{
  "TransactionType": "OfferCreate",
  "Account": "<ALICE>",
  "TakerPays": { "currency": "48424F4E44…", "issuer": "<ISSUER>", "value": "20" },
  "TakerGets": { "currency": "USD", "issuer": "<STABLE>", "value": "2020" },
  "Flags": 262144
}
\`\`\`

- \`TakerPays\`: what ALICE wants, 20 HBOND.
- \`TakerGets\`: the **most** she'll pay, 20 × 101 USD. It's a cap: she pays the book price, here 100.
- \`Flags: 262144\` is \`tfFillOrKill\` (\`0x00040000\`): all 20 now, or nothing. Without it, an unfilled remainder would sit on the book and might fill hours later.

\`\`\`
✔ alice: buy 20 HBOND at ≤ 101 USD: tesSUCCESS
  ALICE now holds 479 HBOND and 8000 USD
✘ alice: buy 5 HBOND at ≤ 99 USD: tecKILLED
\`\`\`

2,000 USD went out and 20 HBOND came in, in one transaction. With the cap under the book price, \`tecKILLED\`: nothing happened, only the fee was spent.

### KYC is enforced at the exchange too

CAROL has USD and a trust line to HBOND, but it was never approved:

\`\`\`
✘ carol: buy 1 HBOND at ≤ 101 USD: tecNO_AUTH
✘ carol: resting buy offer, no flags: tecNO_AUTH
\`\`\`

She can't even place a resting order. **The exchange is open to anyone, but the token is not**, and the ledger enforces that without any code of yours. This is what makes a public DEX usable for a regulated security: the market is only ever between approved accounts.

### Other flags you'll meet

| Flag | Value | Effect |
|---|---|---|
| \`tfPassive\` | \`0x00010000\` | Don't take matching offers, only rest on the book |
| \`tfImmediateOrCancel\` | \`0x00020000\` | Fill what you can now, drop the rest |
| \`tfFillOrKill\` | \`0x00040000\` | Fill everything now, or nothing |
| \`tfSell\` | \`0x00080000\` | Sell all of TakerGets even if you get more than asked |

### In the Xahau docs

- [OfferCreate flags](https://docs.xahau.network/protocol-reference/transactions/transaction-types/offercreate/)
- [Result codes (tecKILLED, tecNO_AUTH)](https://docs.xahau.network/protocol-reference/transactions/transaction-results/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/33-subscribe.js" },
          language: "javascript",
          code: example("33-subscribe.js"),
        },
      ],
      slides: [
        {
          title: { en: "Buying = the Opposite Offer" },
          content: { en: "TakerPays: what I want (HBOND)\nTakerGets: the most I'll pay (USD cap)\ntfFillOrKill: all now or nothing\n\nOne transaction = DvP" },
          visual: "🔄",
        },
        {
          title: { en: "KYC at the Door" },
          content: { en: "Unapproved account:\ncan't fill, can't even rest an order\n→ tecNO_AUTH\n\nPublic market, private token" },
          visual: "🚪",
        },
      ],
    },
    {
      id: "m4l4",
      title: { en: "The Secondary Market" },
      theory: {
        en: `Once investors hold HBOND, they can sell to each other on the same order book. No marketplace, no broker: a holder places an offer, and any **approved** account can take it.

### An investor asks a higher price

\`\`\`
✔ alice: sell 10 HBOND at 105 USD: tesSUCCESS
  Cancel it later with: node 34-sell-offer.js ALICE --cancel 843283781
  100.00 USD  x 4950 HBOND  from TREASURY
  105.00 USD  x 10 HBOND  from ALICE
\`\`\`

The book now has two sellers. Buyers get the treasury's 100 USD offer first because it's cheaper; ALICE's 10 at 105 wait behind. \`OfferCancel\` with the offer's sequence number removes hers.

### The issuer's levers on secondary trading

- **TransferRate**: a fee on every transfer between two non-issuer accounts, set in billionths: \`TransferRate: 1002000000\` is 0.2%. The fee isn't paid to anyone: the extra tokens go back to the issuer, which destroys them. We tested it with a scratch issuer at 0.2%:

  \`\`\`
  ✘ T -> A 100, no SendMax: tecPATH_PARTIAL
  ✔ T -> A 100, SendMax 100.2: tesSUCCESS
  T 899.8 A 100
  ✔ issuer -> A 10 (no SendMax): tesSUCCESS
  DEX: T 899.8 -> 889.78  A 100 -> 110
  \`\`\`

  Three things to know. A payment between holders now **needs a \`SendMax\`** that covers the fee, or it fails; \`21-transfer.js\` reads the issuer's rate and adds one. Payments to or from the issuer pay no fee. On the DEX, the **seller** pays it: the treasury gave 10.02 to deliver 10. That includes the treasury's own primary sales, since the treasury isn't the issuer. Many RWA issuers leave it at 0 and charge fees off the ledger.
- **TickSize**: how many significant digits offer prices keep (Module 2 set 5). Fewer digits means a tidier book and less "penny-jumping".
- **Freeze**: a frozen holder's offers can't be filled, since the holder can't send.
- **RequireAuth**: only approved accounts can be on either side, as lesson 3 showed.

### Beyond the order book

Large trades between two known parties (OTC) don't need to go on the public book: an offer between them will cross just the same, or you can use **Checks** (\`CheckCreate\` / \`CheckCash\`), a signed "cheque" the other party cashes when ready. For price discovery and small holders, the book is enough.

### In the Xahau docs

- [OfferCancel](https://docs.xahau.network/protocol-reference/transactions/transaction-types/offercancel/)
- [AccountSet (TransferRate, TickSize)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)
- [Checks](https://docs.xahau.network/protocol-reference/transactions/transaction-types/checkcreate/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/34-sell-offer.js" },
          language: "javascript",
          code: example("34-sell-offer.js"),
        },
      ],
      slides: [
        {
          title: { en: "Secondary Trading" },
          content: { en: "Holders post their own offers\nBest price fills first\nOnly approved accounts on either side\n\nIssuer levers: TransferRate · TickSize · freeze" },
          visual: "📊",
        },
      ],
    },
  ],
}

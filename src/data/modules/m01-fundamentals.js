export default {
  id: "m1",
  icon: "🏢",
  title: { en: "RWA Fundamentals" },
  lessons: [
    {
      id: "m1l1",
      title: { en: "What Tokenization Actually Means" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **RWA (real-world asset)** | Something that exists off the ledger and has value: a building, a bond, a fund share, gold, an invoice. |
| **Tokenization** | Recording rights to that asset as tokens on a ledger, so they can be held, transferred and serviced there. |
| **Legal wrapper** | The contracts and companies that make the token a real claim on the asset. |
| **SPV** | Special purpose vehicle: a company created only to own one asset, so that asset is kept apart from everyone else's debts. |
| **Custodian** | Whoever actually holds the asset (or the cash) the tokens stand for. |
| **Fungible / non-fungible** | Interchangeable units (shares of a bond) / one-of-a-kind items (a specific deed). |

Any other term: see the [Glossary](?m=0&l=9).

### Three layers, not one

"Putting a building on the blockchain" is a misleading phrase. A building cannot be on a ledger. What can be on a ledger is a **record of who has which rights to it**. Every tokenized asset has three layers:

1. **The asset**: the warehouse, the government bond, the gold bar. It lives in the physical or legal world.
2. **The claim**: a legal right to the asset or its income, usually through a company that owns the asset (the SPV) and a contract that says what each token holder is owed.
3. **The token**: the on-ledger record of who holds each claim.

The token is only as good as the two layers under it. If the SPV does not own the warehouse, or the contract does not recognise token holders, the token is a number on a ledger and nothing more.

### What tokenization changes

Everything that happens **after** the claim exists gets faster, cheaper and more transparent:

| Without a ledger | With a token on Xahau |
|---|---|
| A registrar keeps the list of holders in a private database | The list is the ledger: anyone can read it ([Module 5](?m=5&l=0)) |
| Settlement takes days; payment and delivery happen separately | Asset and payment swap in one transaction, in seconds ([Module 4](?m=4&l=2)) |
| Coupons go through several banks | The issuer pays every holder directly, with a verifiable record ([Module 5](?m=5&l=1)) |
| Restrictions ("only verified investors") are checked by hand | The ledger refuses unapproved holders on its own ([Module 3](?m=3&l=0)) |
| An auditor asks for statements | The auditor reads supply, holders and history directly ([Module 2](?m=2&l=3)) |

### What tokenization does not change

- **The asset's risk.** A bad building is a bad token.
- **The need to trust the issuer and custodian.** The ledger proves who holds tokens; it cannot prove the warehouse exists.
- **The law.** A tokenized bond is still a bond. Securities rules, investor protection and tax apply as they would without a ledger ([Module 11](?m=11&l=1)).

### Kinds of RWA you will meet

| Asset | Typical token | Why tokenize |
|---|---|---|
| Government bonds / money-market funds | Fungible, redeemable for a stablecoin | 24/7 settlement, on-ledger cash management |
| Corporate bonds (our Harbor Bond) | Fungible, with coupons and maturity | Direct distribution, automated servicing |
| Real estate | Fungible shares of an SPV, plus a unique deed | Fractional ownership, a transparent cap table |
| Commodities (gold) | Fungible, redeemable for a quantity | Divisible, instantly transferable title |
| Invoices, receivables | Unique, one per invoice | Financing specific, verifiable documents |
| Certificates (carbon, provenance) | Unique, often non-transferable | Proof that can't be forged or double-counted |`,
      },
      slides: [
        {
          title: { en: "Three Layers" },
          content: { en: "1. The asset (off the ledger)\n2. The legal claim (SPV + contract)\n3. The token (who holds the claim)\n\nThe token is only as good as 1 and 2" },
          visual: "🏗️",
        },
        {
          title: { en: "What Changes" },
          content: { en: "Registry → the ledger itself\nT+2 settlement → one transaction\nManual checks → ledger-enforced rules\n\nWhat doesn't: asset risk, trust, law" },
          visual: "⚖️",
        },
      ],
    },
    {
      id: "m1l2",
      title: { en: "The Token Is Not the Asset: the Legal Wrapper" },
      theory: {
        en: `A token holder can only enforce what a contract says they can. This lesson is the minimum a developer needs to understand about that contract, because it decides what the code must do.

### The usual structure

\`\`\`
Investors ──hold──▶ HBOND tokens ──are claims on──▶ Harbor Bond SPV Ltd. ──owns──▶ the warehouse
                                                          │
                                   bond terms (prospectus): 100 USD face, 5% coupon, 2030
\`\`\`

- The **SPV** owns the asset and nothing else, so if the company that set it up goes bankrupt, the warehouse is not part of that bankruptcy. Lawyers call this **bankruptcy remoteness**.
- The **terms** (for a bond: the prospectus or offering memorandum) say what one token entitles you to: interest, repayment, a share of sale proceeds, voting.
- A **custodian** or trustee may hold the asset or the cash for the benefit of token holders.

### Which record wins?

The most important legal question for a developer: **if the ledger and a paper register disagree, which one is right?**

- In some jurisdictions the law lets a ledger **be** the official register of a security. Then a token transfer **is** the legal transfer.
- In others the token is only **evidence**, and an off-ledger register (kept by a transfer agent) is authoritative. Then the ledger must be kept in sync with it, and the issuer must be able to **correct** the ledger when the register says so.

That second case is why RWA tokens need powers that ordinary cryptocurrencies don't: approving holders, freezing, and taking tokens back after a court order or a lost key ([Module 3](?m=3&l=3)). They are not there to let the issuer misbehave; they are there so the ledger can follow the law.

### What the terms must say about the token

Good tokenization terms answer, explicitly:

- Who the **issuer account** is (its address), so nobody can pass off another token as the real one ([Module 2](?m=2&l=4)).
- That holders must pass **KYC** and that unapproved accounts can't hold ([Module 3](?m=3&l=0)).
- When and why the issuer may **freeze** or **claw back** ([Module 3](?m=3&l=1)).
- How and when **payments** are made, and what counts as the record date ([Module 5](?m=5&l=0)).
- How **redemption** works at maturity ([Module 5](?m=5&l=3)).
- What happens if a holder **loses their key** ([Module 10's incident](?m=10&l=3)).

### What never goes on the ledger

Names, ID documents, KYC results, addresses, anything personal. The ledger is public and permanent, and privacy law (for example GDPR in Europe) gives people the right to have personal data erased, which a ledger can't do. The ledger records **that** an account was approved, never who owns it.`,
      },
      slides: [
        {
          title: { en: "The Wrapper" },
          content: { en: "Investors → tokens → SPV → asset\n\nTerms say what a token is worth\nSPV keeps the asset bankruptcy-remote" },
          visual: "📜",
        },
        {
          title: { en: "Which Record Wins?" },
          content: { en: "Ledger = the register → transfer is legal\nLedger = evidence → must follow the register\n\nHence: approval, freeze, clawback" },
          visual: "⚖️",
        },
      ],
    },
    {
      id: "m1l3",
      title: { en: "Fungible or Unique: Choosing the Token Model" },
      theory: {
        en: `Xahau gives you two native ways to represent an asset, and many real projects use both.

### Issued tokens (IOUs) for fungible claims

An **issued token** is a balance on a trust line between a holder and an issuer. It is the right tool when every unit is interchangeable: bond units, fund shares, grams of gold, stablecoin dollars.

What makes it a strong fit for RWAs is built into the ledger, no smart contract needed:

- **Approval**: with \`RequireAuth\`, only accounts the issuer approved can hold it.
- **Freeze** of one holder, of all holders, or a **deep freeze**.
- **Clawback**: the issuer can take tokens back.
- **DEX trading** against any other token, with delivery versus payment.
- **Escrow** and **payment channels** for tokens (with a catch, [Module 5](?m=5&l=2)).
- **Transfer fees** and **tick size** set by the issuer.

### URITokens for unique assets

A **URIToken** is one ledger object with an issuer, an owner, a link (URI) and optionally a fingerprint of a document (Digest). It is the right tool when the asset is one of a kind: a title deed, a specific invoice, a certificate, a warehouse receipt for one pallet.

It gives you: a fixed, verifiable **issuer**; a **Digest** that ties it to one exact document; **Remarks** for attributes, immutable or updatable; sale reserved for one buyer; and, if minted **burnable**, the issuer's power to revoke it.

### Both together: fractional ownership

The classic real-estate pattern combines them:

\`\`\`
URIToken "Deed PX-2291-0007"  (owned by the SPV, fingerprint of the title document)
        ▲ remark "secures: HBOND.rIssuer"
        │
Issuer account remarks: "collateral: <deed ID>"
        │
        ▼
HBOND issued token (10,000 units held by investors)
\`\`\`

One unique token proves **what** the SPV owns; the fungible token divides the claim on it among investors. [Module 6](?m=6&l=4) builds exactly this link on the ledger, so a reader starting from either side finds the other.

### Comparison

| | Issued token (IOU) | URIToken |
|---|---|---|
| Units | Divisible, interchangeable | One object, indivisible |
| Holder needs | A trust line (their own consent) | Nothing (but can refuse offers) |
| Issuer approval of holders | Yes, \`RequireAuth\` | No built-in approval |
| Freeze / clawback | Yes | Issuer can burn if minted burnable |
| Trades on the DEX | Yes | Sold with its own offers |
| Carries a document fingerprint | No (use Remarks on the issuer) | Yes, \`Digest\` |
| Good for | Bonds, fund shares, commodities, stablecoins | Deeds, invoices, certificates |

### Coming from the XRP Ledger?

Xahau shares the XRP Ledger's issued tokens and their controls, but not everything: at the time of writing Xahau has **no MPTokens and no AMM** on mainnet. Issued tokens with \`RequireAuth\` play the role MPTokens play on the XRP Ledger, and Xahau adds URITokens, Remarks, Hooks and token escrow, which this course uses.

### In the Xahau docs

- [Trust lines (RippleState)](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/ripple-state/)
- [URITokens](https://docs.xahau.network/features/network-features/uritoken/)
- [What is different from the XRP Ledger](https://docs.xahau.network/what-is-different/)`,
      },
      slides: [
        {
          title: { en: "Two Native Models" },
          content: { en: "IOU → fungible claims\n(bonds, fund shares, gold)\n\nURIToken → one unique asset\n(deed, invoice, certificate)" },
          visual: "🪙",
        },
        {
          title: { en: "Fractional Ownership" },
          content: { en: "Deed as a URIToken, owned by the SPV\n+ IOU shares of the SPV for investors\n+ Remarks linking the two" },
          visual: "🧩",
        },
      ],
    },
    {
      id: "m1l4",
      title: { en: "Roles and Account Architecture" },
      theory: {
        en: `A tokenized asset involves several parties. On the ledger, each one that acts is an account, and keeping their jobs apart is the first security decision you make.

### The parties

| Party | Job | On the ledger? |
|---|---|---|
| **Issuer** | The legal entity whose obligation the token is (the SPV) | Yes: the issuer account |
| **Treasury / operations** | Distributes supply, pays coupons and principal | Yes: a separate account |
| **Investors** | Hold and trade the token | Yes: their own accounts |
| **KYC provider** | Checks identities, tells the issuer who may be approved | No: off-ledger |
| **Transfer agent / registrar** | Keeps the legal register, if the ledger isn't it | Sometimes: reads the ledger, may trigger actions |
| **Custodian / trustee** | Holds the asset or cash for holders | Sometimes: may hold stablecoin reserves |
| **Administrator / oracle** | Calculates and publishes NAV | Yes: an oracle object ([Module 7](?m=7&l=0)) |
| **Stablecoin issuer** | Provides the settlement currency | Yes: a separate issuer |
| **Auditor / regulator** | Checks everything | Reads only |

### Cold issuer, hot treasury

Never use the issuer account for day-to-day work. The course follows the standard split:

- **ISSUER (cold)**: sets the token's rules, approves holders, freezes, claws back, signs rarely. Its key(s) can create unlimited tokens, so they live offline and, in production, behind multisig ([Module 8](?m=8&l=1)).
- **TREASURY (hot)**: receives the whole supply once, then does the frequent work: selling, paying coupons, running the redemption window. If its key leaks, the damage is limited to what it holds, and the issuer can freeze it.

\`\`\`
            ISSUER (cold, multisig)
         issues once │ approves, freezes, claws back
                     ▼
    TREASURY (hot) ──sells / pays──▶ ALICE, BOB (approved investors)
          ▲                                 │
          └──────── USD from STABLE ◀────────┘
\`\`\`

The issuer holds no tokens itself: from its point of view every token in existence is a debt it owes, visible as a negative balance on each holder's trust line.

### Why not one account?

Because the issuer account can never be replaced: the token **is** "currency X from this address". If its key is compromised, the only way out is a new token and a migration of every holder. A treasury, by contrast, can be swapped in an afternoon.`,
      },
      slides: [
        {
          title: { en: "Who Does What" },
          content: { en: "Issuer: the obligor, sets the rules\nTreasury: sells and pays\nInvestors: hold and trade\nKYC, custodian, administrator: off-ledger jobs" },
          visual: "👥",
        },
        {
          title: { en: "Cold Issuer, Hot Treasury" },
          content: { en: "Issuer key → unlimited tokens\n→ offline, multisig, rarely used\n\nTreasury key → only what it holds\n→ replaceable" },
          visual: "🧊",
        },
      ],
    },
    {
      id: "m1l5",
      title: { en: "What the Ledger Can Enforce, and What It Can't" },
      theory: {
        en: `Before building, here is the map of the whole course: which promises in a term sheet Xahau enforces by itself, which ones need code, and which ones only the law can keep. Every "Yes" in this table was tested on testnet in a later module.

### Enforced by the ledger itself

| Promise | Mechanism | Module |
|---|---|---|
| Only approved investors can hold | \`RequireAuth\` + authorised trust lines | 3 |
| An unapproved account can't even place an order | Same: the DEX returns \`tecNO_AUTH\` | 4 |
| A holder can be stopped from selling | Freeze (holder can still return tokens to the issuer) | 3 |
| A holder can be stopped from receiving | Deep freeze | 3 |
| All transfers can be halted | Global freeze | 3 |
| Tokens can be recovered after a court order or lost key | Clawback | 3, 10 |
| An account accepts money only from known senders | DepositAuth + DepositPreauth | 3 |
| Payment and delivery happen together | DEX offers, URIToken sales | 4, 6 |
| Coupon money is set aside and can't be spent early | Escrow of the stablecoin | 5 |
| A document can't be swapped after the fact | URIToken \`Digest\` | 6 |
| Facts can be published that can never be changed | Immutable Remarks | 2, 6 |
| No single person can act for the issuer | Multisig | 8 |

### Needs code (Hooks), with limits

| Promise | How | The limit |
|---|---|---|
| Buy from the issuer 24/7 at a fixed price | A Hook on the treasury that sells on payment | Only for payments **to** the treasury |
| No investor holds more than X% | A Hook on the issuer | It can't block a transfer between two holders: it can only react afterwards (freeze) |
| Lock-up periods | Escrow, or a freeze until a date | Escrow of the token is impossible if clawback is on ([Module 5](?m=5&l=2)) |

### Only the law can keep

- That the warehouse exists and the SPV owns it.
- That the NAV the administrator publishes is correct.
- That token holders will actually be paid if the SPV runs out of money.
- That the issuer uses freeze and clawback only as the terms allow.

The ledger makes every one of those **visible**: a missed coupon, a clawback, a stale NAV are all public and permanent. That transparency is a real part of investor protection, but it isn't the same thing as enforcement.`,
      },
      slides: [
        {
          title: { en: "Ledger-Enforced" },
          content: { en: "KYC-only holding · freeze · deep freeze\nglobal freeze · clawback · DepositAuth\nDvP · escrow · Digest · immutable Remarks\nmultisig" },
          visual: "🛡️",
        },
        {
          title: { en: "Code, With Limits" },
          content: { en: "Hooks can sell on payment\nbut can't block holder-to-holder transfers\n\nOnly law: asset exists, NAV is right,\nissuer can pay" },
          visual: "🧭",
        },
      ],
    },
  ],
}

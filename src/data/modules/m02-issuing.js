import { example } from '../example-code.js'

export default {
  id: "m2",
  icon: "🪙",
  title: { en: "Issuing a Fungible Token" },
  lessons: [
    {
      id: "m2l1",
      title: { en: "Configure the Issuer Before Anything Else" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **AccountSet** | The transaction that changes an account's settings. |
| **Flag (asf…)** | A numbered on/off setting, turned on with \`SetFlag\` and off with \`ClearFlag\`. |
| **RequireAuth** | Nobody may hold the issuer's token until the issuer approves their trust line. |
| **DefaultRipple** | The token may move between holders (without it, holders can only deal with the issuer). |
| **Clawback** | The issuer may take its tokens back from a holder. |
| **Obligations** | The issuer's tokens in other people's hands: the supply in circulation. |

Any other term: see the [Glossary](?m=0&l=9).

An issuer's most important settings can only be turned on **while the account owns no ledger objects at all**: no trust lines, no offers, no escrows. Set them first, before a single holder exists, or you may never be able to set them.

### The settings for a regulated token

| Setting | How | Why | Reversible? |
|---|---|---|---|
| **RequireAuth** | \`SetFlag: 2\` | Only KYC-approved accounts can hold | On: only while the account owns no objects. Off: any time, but turning it back on needs an account that owns nothing again |
| **AllowTrustLineClawback** | \`SetFlag: 17\` **on Xahau** | Recover tokens after a court order or lost key | **Never**, once on. Can only be turned on while the account owns no objects, and not if NoFreeze is set |
| **DefaultRipple** | \`SetFlag: 8\` | Holders can trade with each other | Yes |
| **Domain** | \`Domain: hex("harbor-bond.example")\` | Links the account to the issuer's website | Yes |
| **TransferRate** | \`TransferRate: 0\` (none) | A fee on holder-to-holder transfers. With one, every such payment needs a \`SendMax\` ([Module 4](?m=4&l=3)) | Yes |
| **TickSize** | \`TickSize: 5\` | DEX prices keep 5 significant digits | Yes |

Flags go one per \`AccountSet\`; fields like \`Domain\` can go together.

### Note: the clawback flag has a different number on Xahau

On the XRP Ledger, \`asfAllowTrustLineClawback\` is **16**. On Xahau, **16 is \`asfDisallowIncomingRemit\`**, and clawback is **17**.

### If a trust line already exists

\`10-issuer-setup.js\` checks this before sending anything. If some account has already opened a trust line to the issuer, for example an investor script run before this one, it stops and lists the lines in the way. Turning the lines' limits to 0 isn't enough on its own; a line disappears only when every setting on it is back to its default. For the course's own roles, \`node 10-issuer-setup.js --remove-empty-lines\` has each role holding nothing remove its line (limit 0 with \`tfSetNoRipple\`), then configures the issuer. A line that holds tokens can't be removed this way: start over with a new issuer (\`01-create-accounts.js\`).

### What not to set

- **NoFreeze** (\`SetFlag: 6\`) permanently gives up the power to freeze individual lines, and to ever lift a global freeze. It also rules out enabling clawback. Some stablecoins set it as a promise to users; a regulated security almost never should.
- **Blackholing** (removing every key from the issuer, so nobody can ever issue more) is common for community tokens. An RWA issuer must stay alive: it has to approve investors, pay, and follow court orders.

### The result on testnet

\`\`\`
✔ asfRequireAuth: tesSUCCESS
✔ asfAllowTrustLineClawback: tesSUCCESS
✔ asfDefaultRipple: tesSUCCESS
✔ Domain + TransferRate + TickSize: tesSUCCESS
Issuer rN4AAuFksWwA2fwV3mgRNVNirMKqfRRpZT
  requireAuthorization:   true
  allowTrustLineClawback: true
  defaultRipple:          true
  noFreeze:               false
  Domain:                 harbor-bond.example
  TickSize:               5
\`\`\`

\`account_flags\` in the \`account_info\` answer decodes the flags into words, so you don't have to do bit arithmetic on \`Flags\`.

### In the Xahau docs

- [AccountSet and its flags](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)
- [The AccountRoot object](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/accountroot/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/10-issuer-setup.js" },
          language: "javascript",
          code: example("10-issuer-setup.js"),
        },
      ],
      slides: [
        {
          title: { en: "Set These First" },
          content: { en: "RequireAuth (2)\nAllowTrustLineClawback (17 on Xahau!)\nDefaultRipple (8)\nDomain · TransferRate · TickSize\n\nAfter the first trust line: tecOWNERS" },
          visual: "⚙️",
        },
        {
          title: { en: "16 ≠ 17" },
          content: { en: "XRPL: 16 = clawback\nXahau: 16 = DisallowIncomingRemit\n\nSucceeds silently. Read the flags back." },
          visual: "⚠️",
        },
      ],
    },
    {
      id: "m2l2",
      title: { en: "Naming the Token: Currency Codes" },
      theory: {
        en: `A token is identified by **two** things together: its **currency code** and its **issuer's address**. The code alone means nothing: anybody can issue a token called "USD" or "HBOND". Wallets, exchanges and your own code must always check the issuer too.

### Two formats

The currency field on the ledger is 160 bits (20 bytes):

- **Standard codes**: exactly **three** characters, like \`USD\`, \`EUR\`, \`GLD\`. Written as-is in JSON.
- **Non-standard codes**: anything else, written as **40 hexadecimal characters**. Put the name's bytes first and pad with zeros.

\`\`\`
USD          -> USD                                       standard (3 chars), reads back as "USD"
EUR          -> EUR                                       standard (3 chars), reads back as "EUR"
HBOND        -> 48424F4E44000000000000000000000000000000  non-standard (40 hex), reads back as "HBOND"
HARBOR-2030  -> 484152424F522D32303330000000000000000000  non-standard (40 hex), reads back as "HARBOR-2030"
XAH          -> ✘ XAH is reserved for the native coin
\`\`\`

Rules worth knowing:

- \`XAH\` can't be used as a token code.
- A 40-hex code must not start with \`00\`: that prefix is reserved for the standard format.
- Names longer than 20 bytes don't fit. Keep the full legal name for the Remarks (lesson 5).

### Choosing a code for a security

Short, unambiguous, and unlikely to be confused with a currency: \`HBOND\` rather than \`USD\` or \`HB\`. Many issuers include the maturity year (\`HARBOR30\`), which makes each issuance a separate currency: when Harbor issues a 2035 bond, it is a different token and can't be mixed up with the 2030 one.

In the course's code, \`currencyCode()\` does the conversion and \`currencyName()\` turns it back into text for printing.

### In the Xahau docs

- [Currency codes and amounts](https://docs.xahau.network/protocol-reference/data-types/currency-formats/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/11-currency-code.js" },
          language: "javascript",
          code: example("11-currency-code.js"),
        },
      ],
      slides: [
        {
          title: { en: "Code + Issuer" },
          content: { en: "3 chars → as-is (USD)\nlonger → 40 hex (HBOND = 48424F4E44…)\n\nA token = code AND issuer address\nNever trust the code alone" },
          visual: "🏷️",
        },
      ],
    },
    {
      id: "m2l3",
      title: { en: "Trust Lines and Creating the Supply" },
      theory: {
        en: `### A trust line with RequireAuth: two steps

To hold HBOND, an account needs a trust line to the issuer. With \`RequireAuth\` on, that line exists in two halves:

1. **The holder asks.** A \`TrustSet\` from the holder, with the most it is willing to hold:
   \`\`\`json
   { "TransactionType": "TrustSet", "Account": "<TREASURY>",
     "LimitAmount": { "currency": "48424F4E44…", "issuer": "<ISSUER>", "value": "1000000" } }
   \`\`\`
2. **The issuer approves.** A \`TrustSet\` from the issuer, pointing at the holder, with the \`tfSetfAuth\` flag (\`0x00010000\`):
   \`\`\`json
   { "TransactionType": "TrustSet", "Account": "<ISSUER>", "Flags": 65536,
     "LimitAmount": { "currency": "48424F4E44…", "issuer": "<TREASURY>", "value": "0" } }
   \`\`\`
   Notice the swap: in the issuer's \`TrustSet\`, the \`issuer\` field holds the **other** account. \`LimitAmount\` always describes the line from the signer's side, and the issuer's limit is 0 because it doesn't want to hold its own token.

Approval is permanent: there is no "un-authorise". To stop a holder later, you freeze them ([Module 3](?m=3&l=1)).

### Issuing = paying

There is no "mint" for issued tokens. The issuer **creates** tokens by paying them to someone, and **destroys** them when they are paid back to it:

\`\`\`
✔ treasury: trust line: tesSUCCESS
✔ issuer: authorise treasury: tesSUCCESS
Treasury line: limit 1000000, balance 0, authorised by issuer: true
✔ issue 10000 HBOND to treasury: tesSUCCESS
Treasury holds 10000 HBOND
\`\`\`

The course issues the whole supply to the TREASURY once, and never issues again. That matches a bond, which has a fixed size. A fund with ongoing subscriptions would instead issue each time new money comes in.

### Who pays for the trust line

The trust line's reserve (0.2 XAH) is paid by the account that created it with a non-zero limit: the holder. An issuer with 10,000 investors pays nothing for their lines. The flip side: an investor needs a little XAH to hold your token, which the onboarding flow must explain.

### In the Xahau docs

- [TrustSet and its flags](https://docs.xahau.network/protocol-reference/transactions/transaction-types/trustset/)
- [Trust lines (RippleState)](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/ripple-state/)
- [Payment](https://docs.xahau.network/protocol-reference/transactions/transaction-types/payment/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/12-treasury-line.js" },
          language: "javascript",
          code: example("12-treasury-line.js"),
        },
        {
          title: { en: "examples/13-issue-supply.js" },
          language: "javascript",
          code: example("13-issue-supply.js"),
        },
      ],
      slides: [
        {
          title: { en: "Two Halves of a Line" },
          content: { en: "1. Holder: TrustSet with a limit\n2. Issuer: TrustSet with tfSetfAuth, limit 0\n\nApproval can't be undone: freeze instead" },
          visual: "🤝",
        },
        {
          title: { en: "No Mint" },
          content: { en: "Issuer pays → tokens exist\nPaid back to issuer → tokens gone\n\nWhole supply → treasury, once" },
          visual: "💸",
        },
      ],
    },
    {
      id: "m2l4",
      title: { en: "Reading the Supply and the Holders" },
      theory: {
        en: `Anyone can audit an issued token from the ledger alone. Two requests do it.

### gateway_balances: the issuer's total obligations

\`gateway_balances\` looks at every trust line of the issuer and adds them up. Name your own operating accounts in \`hotwallet\` and it separates them from investors:

\`\`\`json
{ "command": "gateway_balances", "account": "<ISSUER>", "hotwallet": ["<TREASURY>"] }
\`\`\`

- \`obligations\`: tokens held by everyone **except** the hot wallets **and except frozen lines**. For a bond, the part actually sold, as long as nobody is frozen.
- \`balances\`: what each hot wallet holds. For a bond, the unsold part.
- \`frozen_balances\`: amounts on frozen lines, per account. They are **left out** of \`obligations\`, so add them back for the true total: a frozen holder still holds the bond and is still owed principal. \`supply()\` in \`lib/xahau.js\` does exactly that, and every script that sizes a payout or checks the supply is zero uses it.

After investors bought some HBOND ([Module 3](?m=3&l=0) onwards), the report read:

\`\`\`
HBOND outside the treasury, not frozen: 800
HBOND in the treasury:        9200
HBOND outside the treasury: 800

4 HBOND trust line(s):
  rhyAtsMkqfnzUJLzyof95Ms27DLYV1QYgW  HBOND  0  NOT authorised
  rDjqmYCaD6kh4dZxixbPCVuY3Kbi7EEcZd  HBOND  9200  authorised
  r4EWm17wpwAvThQQGGr9TCxN2aKaUKBSYP  HBOND  350  authorised
  rHurvZGUnhquLjCHNAAwQTV3ksrPoQW2U8  HBOND  450  authorised
\`\`\`

### account_lines: the cap table

\`account_lines\` on the issuer lists every holder, with flags that matter for compliance: \`authorized\` (approved by the issuer), \`freeze\` (frozen by the issuer). Seen from the issuer, balances are **negative**: \`-450\` means "the issuer owes 450". The script flips the sign for printing.

Keep two things in mind when you use this as a register:

- Results come in **pages** (\`marker\`). [Module 5's snapshot](?m=5&l=0) pins one ledger index so every page describes the same moment.
- A line with balance 0 is not a holder, but it may be a pending KYC request (CAROL above).

### In the Xahau docs

- [Request methods (gateway_balances, account_lines)](https://docs.xahau.network/features/http-websocket-apis/public-api-methods/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/14-supply-report.js" },
          language: "javascript",
          code: example("14-supply-report.js"),
        },
      ],
      slides: [
        {
          title: { en: "Audit From the Ledger" },
          content: { en: "gateway_balances → supply sold vs unsold\naccount_lines → every holder, approved?, frozen?\n\nIssuer sees −450 = owes 450" },
          visual: "🧾",
        },
      ],
    },
    {
      id: "m2l5",
      title: { en: "Issuer Identity: Domain and an On-Ledger Fact Sheet" },
      theory: {
        en: `Since anyone can issue a token called HBOND, investors need a way to be sure they hold the **real** one. The answer is to link the issuer account and the issuer's legal identity in both directions.

### Account → website

The \`Domain\` field set in lesson 1 says "this account belongs to harbor-bond.example". On its own it proves nothing (anyone can type any domain), so the website must confirm it.

### Website → account

Publish the issuer's address where investors already trust you: the prospectus, your website, your regulator's filing. Xahau also has a standard, machine-readable way: a **\`xahau.toml\`** file.

- Served over HTTPS at exactly \`/.well-known/xahau.toml\` on your domain, e.g. \`https://harbor-bond.example/.well-known/xahau.toml\` (lowercase path), with content type \`application/toml\` and the header \`Access-Control-Allow-Origin: *\` so wallets can read it from a browser.
- \`[[ACCOUNTS]]\` lists the addresses you control; \`[[CURRENCIES]]\` lists each token you issue, as \`code\` **and** \`issuer\`.
- \`[METADATA]\` carries \`modified\` and \`expires\` dates; after \`expires\` the file counts as invalid, so renew it.

\`examples/assets/xahau.toml\` is Harbor Bond's version. The rule is the one the Xahau docs state for every attestation: **the account names the domain (\`Domain\`), and the domain names the account (the TOML)**. Only both together prove the link.

### Remarks: the fact sheet on the account itself

Xahau lets an account owner write **Remarks** on its own \`AccountRoot\`. Anyone who looks up the issuer (and every wallet does, to show a token) can read them. Immutable ones can never change, which is exactly what you want for facts a prospectus fixes:

\`\`\`
✔ issuer fact sheet: tesSUCCESS
  legal_name         Harbor Bond SPV Ltd.  (immutable)
  prospectus_sha256  2B87B63A17DCEA6766AFA46D000BB32108EFD26492C48089D4B3E00D0C4F9EB0  (immutable)
  status             offering open
  token              48424F4E44000000000000000000000000000000 (HBOND): 100 USD face, 5% fixed, matures 2030-06-30  (immutable)
\`\`\`

- \`prospectus_sha256\` is the **fingerprint** of the prospectus file. Anyone holding a copy can hash it and compare: if the numbers match, it is the exact document the issuer committed to. [Module 6](?m=6&l=1) explains fingerprints in detail.
- \`status\` stays mutable: the capstone moves it from "offering open" to "matured and fully redeemed".

Rules: up to 32 remarks per object, names and values up to 256 bytes, **immutable remarks can't be changed or deleted**, and each byte costs one extra drop of fee.

### In the Xahau docs

- [SetRemarks](https://docs.xahau.network/protocol-reference/transactions/transaction-types/setremarks/)
- [AccountSet (Domain)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)
- [Serve a TOML file for identity verification](https://xahau.network/docs/infrastructure/identity/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/15-issuer-profile.js" },
          language: "javascript",
          code: example("15-issuer-profile.js"),
        },
        {
          title: { en: "examples/assets/xahau.toml" },
          language: "toml",
          code: example("assets/xahau.toml"),
        },
      ],
      slides: [
        {
          title: { en: "Prove It's the Real Token" },
          content: { en: "Account → Domain\nDomain → /.well-known/xahau.toml → account\nBoth directions, or it proves nothing" },
          visual: "🔗",
        },
        {
          title: { en: "Fact Sheet in Remarks" },
          content: { en: "legal_name (immutable)\ntoken terms (immutable)\nprospectus_sha256 (immutable)\nstatus (updatable)" },
          visual: "📋",
        },
      ],
    },
  ],
}

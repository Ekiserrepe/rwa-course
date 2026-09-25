import { example } from '../example-code.js'

export default {
  id: "m3",
  icon: "🔐",
  title: { en: "Compliance Controls" },
  lessons: [
    {
      id: "m3l1",
      title: { en: "KYC Onboarding with Authorised Trust Lines" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **KYC** | "Know your customer": verifying who an investor is before they may hold the asset. |
| **Authorised trust line** | A trust line the issuer approved with \`tfSetfAuth\`. With RequireAuth, the only kind that can hold the token. |
| **Freeze** | The issuer stops one holder from sending its token, except back to the issuer. |
| **Deep freeze** | A freeze that also stops the holder receiving the token. |
| **Global freeze** | The issuer stops every transfer of its token at once. |
| **Clawback** | The issuer takes tokens back from a holder; they are destroyed. |
| **DepositAuth** | An account setting: only pre-approved senders can pay it. |

Any other term: see the [Glossary](?m=0&l=9).

With \`RequireAuth\` on the issuer (Module 2), the trust line **is** the KYC allowlist. There is no separate list to keep in sync: an account either has an authorised line or it can't hold HBOND.

### The flow

1. The investor completes KYC with your provider, off the ledger, and gives you their address.
2. The investor opens a trust line: \`TrustSet\` with a limit. This is a **request**; nothing can be received yet.
3. Your backend, once the provider says yes, has the issuer sign \`TrustSet\` with \`tfSetfAuth\` for that line.

\`\`\`
✔ alice: request a trust line: tesSUCCESS
✔ issuer: authorise alice: tesSUCCESS
ALICE: trust line limit 100000, balance 0, authorised: true
✔ bob: request a trust line: tesSUCCESS
✔ issuer: authorise bob: tesSUCCESS
BOB: trust line limit 100000, balance 0, authorised: true
✔ carol: request a trust line: tesSUCCESS
CAROL: trust line limit 100000, balance 0, authorised: false
\`\`\`

### What an unapproved account can't do

We tried every door with CAROL, whose line exists but was never approved:

\`\`\`
✘ treasury -> carol: 10 HBOND: tecPATH_DRY
✘ issuer -> carol (not authorised) directly: tecPATH_DRY
\`\`\`

Not even the issuer can pay her. And, as Module 4 shows, she can't even place an order to buy it (\`tecNO_AUTH\`). Meanwhile approved holders trade freely with each other:

\`\`\`
✔ alice -> bob: 50 HBOND: tesSUCCESS
  ALICE    450
  BOB      350
\`\`\`

### Things to design for

- **Approval is permanent.** There is no "de-authorise". If an investor later fails a periodic review, **freeze** them (next lesson).
- **Approve the address, not the person.** One investor may have several addresses; each needs approval. Your KYC records must map people to addresses, off the ledger.
- **Order matters for the investor.** If the issuer authorises first (it can, by creating the line from its side), the investor still has to set a limit. The flow above, investor first, is the simpler one.

### In the Xahau docs

- [TrustSet flags (tfSetfAuth)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/trustset/)
- [AccountSet (asfRequireAuth)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/20-onboard-investor.js" },
          language: "javascript",
          code: example("20-onboard-investor.js"),
        },
        {
          title: { en: "examples/21-transfer.js" },
          language: "javascript",
          code: example("21-transfer.js"),
        },
      ],
      slides: [
        {
          title: { en: "The Trust Line Is the Allowlist" },
          content: { en: "KYC off-ledger\nInvestor: TrustSet (request)\nIssuer: TrustSet + tfSetfAuth (approve)\n\nUnapproved → tecPATH_DRY, even from the issuer" },
          visual: "🪪",
        },
      ],
    },
    {
      id: "m3l2",
      title: { en: "Freezing One Holder, and the Deep Freeze" },
      theory: {
        en: `A **freeze** acts on one trust line. The issuer sends a \`TrustSet\` for the holder's line with a freeze flag:

| Flag | Value | Effect |
|---|---|---|
| \`tfSetFreeze\` | \`0x00100000\` | Freeze the line |
| \`tfClearFreeze\` | \`0x00200000\` | Lift it |
| \`tfSetDeepFreeze\` | \`0x00400000\` | Deep freeze (needs the line to be frozen too) |
| \`tfClearDeepFreeze\` | \`0x00800000\` | Lift the deep freeze |

### What each one really does

We tested every direction on testnet, with ALICE as the frozen holder:

| Action | Regular freeze | Deep freeze |
|---|---|---|
| ALICE sends to BOB | ✘ \`tecPATH_DRY\` | ✘ |
| BOB sends to ALICE | ✔ **still works** | ✘ \`tecPATH_DRY\` |
| ALICE sends back to the issuer | ✔ | ✔ **still works** |
| The issuer sends to ALICE | ✔ | ✔ **still works** |

So:

- A **regular freeze** stops the holder getting rid of the token, but not receiving more. Use it for "stop this account selling" (a dispute, a sanctions hit under review).
- A **deep freeze** stops the holder receiving as well, so the frozen position can't grow. Use it when the account itself is the problem (stolen keys, a sanctioned party).
- In **both**, the holder can still **return tokens to the issuer**, and the issuer can still pay them. That's deliberate: a frozen holder can always be redeemed or refunded, never trapped.

\`\`\`
✔ freeze alice: tesSUCCESS
  ALICE: frozen by issuer = true, deep = false
✘ alice -> bob: 10 HBOND: tecPATH_DRY
✔ bob -> alice: 10 HBOND: tesSUCCESS
✔ deep-freeze alice: tesSUCCESS
  ALICE: frozen by issuer = true, deep = true
✘ bob -> alice: 10 HBOND: tecPATH_DRY
✔ unfreeze alice: tesSUCCESS
  ALICE: frozen by issuer = false, deep = false
\`\`\`

In \`account_lines\`, a freeze set by the issuer shows on the holder's side as \`freeze_peer\` and \`deep_freeze_peer\`, and on the issuer's side as \`freeze\` / \`deep_freeze\`.

### Freezes are public

Anyone can see a frozen line. That's good for accountability (investors can see the issuer isn't freezing people arbitrarily), but it means a freeze is itself information. Your terms should say when you freeze, and your team should log why, off the ledger.

### In the Xahau docs

- [TrustSet (freeze flags)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/trustset/)
- [Trust lines (RippleState flags)](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/ripple-state/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/22-freeze.js" },
          language: "javascript",
          code: example("22-freeze.js"),
        },
      ],
      slides: [
        {
          title: { en: "Freeze vs Deep Freeze" },
          content: { en: "Freeze: can't send, CAN receive\nDeep: can't send or receive\n\nBoth: can always return to the issuer\nand the issuer can pay them" },
          visual: "🧊",
        },
      ],
    },
    {
      id: "m3l3",
      title: { en: "Global Freeze: the Emergency Stop" },
      theory: {
        en: `A **global freeze** stops every transfer of the issuer's token, between any two accounts, at once. It is one \`AccountSet\` on the issuer: \`SetFlag: 7\` to freeze, \`ClearFlag: 7\` to resume.

### When to use it

- A security incident: the treasury key leaked, or a bug in your integration is minting duplicates.
- A corporate event that requires a frozen register (some jurisdictions require one before certain actions).
- A court or regulator orders it.

### What still works

\`\`\`
✔ set GlobalFreeze: tesSUCCESS
✘ alice -> bob: 10 HBOND: tecPATH_DRY
✘ treasury -> alice: 10 HBOND: tecPATH_DRY
✔ issuer -> alice during global freeze: tesSUCCESS
✔ bob -> issuer during global freeze: tesSUCCESS
✔ clear GlobalFreeze: tesSUCCESS
\`\`\`

The pattern is the same as a single freeze: **only the issuer's own flows** keep working. Holder-to-holder is stopped, and so is the treasury, because the treasury is just another holder. If you run your coupon payments from the treasury in the token itself, a global freeze stops them too; coupons paid in a stablecoin, as in this course, are unaffected.

### Can't undo "never freeze"

If an issuer has set **NoFreeze**, it can no longer freeze individual lines, and a global freeze becomes a one-way switch: it can still be turned **on**, but never **off** again (xahaud, like rippled, silently ignores \`ClearFlag: 7\` once NoFreeze is set: the transaction returns \`tesSUCCESS\` and the flag stays on, the same kind of silent trap as Module 2's flag 16). An emergency stop would then halt the token forever. That is why the preflight check in Module 11 treats "NoFreeze is off" as a blocker for a regulated token.

### In the Xahau docs

- [AccountSet (asfGlobalFreeze, asfNoFreeze)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/23-global-freeze.js" },
          language: "javascript",
          code: example("23-global-freeze.js"),
        },
      ],
      slides: [
        {
          title: { en: "Emergency Stop" },
          content: { en: "AccountSet SetFlag 7\nEvery holder-to-holder transfer stops\nTreasury too (it's a holder)\n\nIssuer ↔ holders still works" },
          visual: "🛑",
        },
      ],
    },
    {
      id: "m3l4",
      title: { en: "Clawback: Taking Tokens Back" },
      theory: {
        en: `**Clawback** lets the issuer remove tokens from a holder's trust line. The tokens are **destroyed**, not transferred: supply shrinks by exactly that amount. To give the value to someone else, the issuer issues new tokens to them.

### When an RWA needs it

- A **court order** transfers a holding (inheritance, divorce, insolvency).
- An investor **lost their keys**: claw back from the old account, re-issue to a new, re-verified one. The capstone (Module 10) does exactly this.
- A **mistaken** or **fraudulent** transfer has to be reversed to match the legal register.

### The transaction

\`\`\`json
{
  "TransactionType": "Clawback",
  "Account": "<ISSUER>",
  "Amount": { "currency": "48424F4E44…", "issuer": "<HOLDER>", "value": "50" }
}
\`\`\`

Careful with \`Amount.issuer\`: in a Clawback it holds the **holder's** address, the account to take from, not the token's issuer. It's the field that trips everyone up.

\`\`\`
✔ claw back 50 HBOND from bob: tesSUCCESS
  BOB: 340 -> 290 HBOND
\`\`\`

### Preconditions

- The issuer must have set \`asfAllowTrustLineClawback\` (**17 on Xahau**) **before** it owned any ledger objects, trust lines included (Module 2), and without NoFreeze set. You can't add it later.
- Once set, it can **never** be turned off. Investors can check it, so your terms must say when you'll use it.
- It works on frozen lines too. The usual sequence for a lost key is freeze → claw back → re-issue.

### The price of clawback: no token escrow

On Xahau, **an issuer that can claw back can't have its token locked in escrow**. We found this when our lock-up escrow of HBOND failed with \`tecNO_PERMISSION\`; xahaud's source code refuses to create a locked balance when the issuer has clawback enabled, since a clawback could otherwise pull tokens out from under an escrow. Module 5 shows the alternatives. Decide which you need, clawback or token escrow, **before** you set up the issuer.

### In the Xahau docs

- [Clawback](https://docs.xahau.network/protocol-reference/transactions/transaction-types/clawback/)
- [AccountSet flags](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/24-clawback.js" },
          language: "javascript",
          code: example("24-clawback.js"),
        },
      ],
      slides: [
        {
          title: { en: "Clawback" },
          content: { en: "Issuer removes tokens → destroyed\nAmount.issuer = the HOLDER\n\nMust be enabled before any trust line\nCan never be disabled" },
          visual: "🪝",
        },
        {
          title: { en: "The Trade-off" },
          content: { en: "Clawback on → token escrow impossible\n(tecNO_PERMISSION)\n\nChoose before the first holder exists" },
          visual: "⚖️",
        },
      ],
    },
    {
      id: "m3l5",
      title: { en: "Controlling What an Account Receives: DepositAuth" },
      theory: {
        en: `Freezes and approvals act on the **token**. Some rules are about an **account**: "our treasury only accepts money from known counterparties". For that, Xahau has **DepositAuth**.

### How it works

- \`AccountSet\` with \`SetFlag: 9\` (\`asfDepositAuth\`): the account refuses every incoming payment, in any currency, unless it signed the transaction itself or the sender is **preauthorised**.
- \`DepositPreauth\` with \`Authorize: <address>\` preauthorises one sender (\`Unauthorize\` removes it).

\`\`\`
✔ treasury: DepositAuth on: tesSUCCESS
✔ treasury: preauthorise alice: tesSUCCESS
✔ alice -> treasury: 1 HBOND: tesSUCCESS
✘ bob -> treasury: 1 HBOND: tecNO_PERMISSION
✔ treasury: remove preauth: tesSUCCESS
✔ treasury: DepositAuth off: tesSUCCESS
\`\`\`

BOB is a fully approved HBOND holder, but the treasury didn't list him, so his payment was refused.

### Where it helps in an RWA

- A **redemption or subscription account** that should only take money from onboarded investors, so unknown funds never land in it (and never have to be returned).
- An **investor's custody account** that accepts only its custodian's transfers.
- It complements RequireAuth: RequireAuth controls who can **hold** your token; DepositAuth controls who can **pay** a given account, in any currency.

### Related: refusing incoming objects

Xahau also has \`asfDisallowIncomingTrustline\`, \`asfDisallowIncomingCheck\`, \`asfDisallowIncomingPayChan\` and \`asfDisallowIncomingRemit\` (the flag 16 from Module 2's trap). They stop other accounts from creating those objects against yours, which keeps spam out of an issuer's directory.

### In the Xahau docs

- [DepositPreauth](https://docs.xahau.network/protocol-reference/transactions/transaction-types/depositpreauth/)
- [AccountSet (asfDepositAuth)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/25-deposit-auth.js" },
          language: "javascript",
          code: example("25-deposit-auth.js"),
        },
      ],
      slides: [
        {
          title: { en: "DepositAuth" },
          content: { en: "Account refuses all incoming payments\nexcept from preauthorised senders\n\nRequireAuth: who can hold\nDepositAuth: who can pay this account" },
          visual: "🚪",
        },
      ],
    },
  ],
}

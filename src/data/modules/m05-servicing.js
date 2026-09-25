import { example } from '../example-code.js'

export default {
  id: "m5",
  icon: "📅",
  title: { en: "Asset Servicing: Coupons, Reserves and Redemption" },
  lessons: [
    {
      id: "m5l1",
      title: { en: "The Record Date: a Snapshot of Holders" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **Servicing** | Everything an issuer does for holders after the sale: paying interest, publishing information, repaying at the end. |
| **Coupon** | A bond's periodic interest payment. 5% a year on 100 USD, paid quarterly, is 1.25 USD per token per quarter. |
| **Record date** | The moment that decides who gets paid: whoever holds the token then. |
| **Escrow** | Funds locked on the ledger until a time or a condition. |
| **Maturity** | The date the bond repays its face value. |
| **Redemption** | Returning tokens to the issuer in exchange for their value. |

Any other term: see the [Glossary](?m=0&l=9).

Paying a coupon starts with a question the ledger answers better than any registrar: **who holds the token right now?**

### One ledger, one moment

The issuer's trust lines are the register. But \`account_lines\` returns them in pages, and between two page requests a new ledger may close and holdings may change. The fix is to **pin a ledger index**: read the latest validated ledger number once, and ask for every page \`at\` that ledger. Every page then describes the same instant. That ledger number **is** your record date, and anyone can recompute the list from it later.

\`\`\`
Record date: ledger 12506512. 2 holder(s), 799 HBOND outside the treasury.
  r4EWm17wpwAvThQQGGr9TCxN2aKaUKBSYP  320
  rHurvZGUnhquLjCHNAAwQTV3ksrPoQW2U8  479
Saved snapshot.json
\`\`\`

### Who is left out, and why

- **The treasury**: unsold tokens earn nothing. It is excluded by address.
- **Zero balances**: lines that exist but hold nothing (pending KYC, or sold out).
- **Frozen holders stay in the list**, marked. Whether they're paid is a legal decision; the next script holds their coupon back rather than silently skipping them.

Open DEX offers don't matter: an offer doesn't move tokens until it fills, so a holder with HBOND on offer still holds it.

### In the Xahau docs

- [account_lines and ledger_index](https://docs.xahau.network/features/http-websocket-apis/public-api-methods/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/40-holder-snapshot.js" },
          language: "javascript",
          code: example("40-holder-snapshot.js"),
        },
      ],
      slides: [
        {
          title: { en: "Record Date = a Ledger Index" },
          content: { en: "Read the validated ledger number once\nPage through account_lines AT it\n\nSame moment for every page\nAnyone can recompute it" },
          visual: "📸",
        },
      ],
    },
    {
      id: "m5l2",
      title: { en: "Paying Coupons Without Paying Twice" },
      theory: {
        en: `A coupon run is a list of payments. The danger isn't the payments, it's the **retry**: a script that crashes halfway and is run again must not pay the first half twice.

### Tag every payment

Each coupon payment carries a **memo** with the record date's ledger:

\`\`\`json
"Memos": [{ "Memo": { "MemoType": "636F75706F6E", "MemoData": "636F75706F6E3A3132353036353132" } }]
\`\`\`

That's hex for \`coupon\` and \`coupon:12506512\`. Before paying, the script reads the treasury's own history (\`account_tx\`) and skips every holder that already received a successful payment with that tag. The ledger is the log, so there's no local state to lose.

\`\`\`
  would pay r4EWm17wpwAvThQQGGr9TCxN2aKaUKBSYP 400 USD
  would pay rHurvZGUnhquLjCHNAAwQTV3ksrPoQW2U8 598.75 USD
✔ coupon 400 USD -> r4EWm17wpwAvThQQGGr9TCxN2aKaUKBSYP: tesSUCCESS
✔ coupon 598.75 USD -> rHurvZGUnhquLjCHNAAwQTV3ksrPoQW2U8: tesSUCCESS
Paid 998.75 USD this run.
--- run again (must skip)
  = r4EWm17wpwAvThQQGGr9TCxN2aKaUKBSYP already paid for ledger 12506512
  = rHurvZGUnhquLjCHNAAwQTV3ksrPoQW2U8 already paid for ledger 12506512
Paid 0 USD this run.
\`\`\`

### Details that matter with real money

- **Round down** to the cent. Rounding up on thousands of holders pays out more than the terms promise.
- **\`--dry-run\` first**, always. The dry run is what your finance team signs off.
- **Frozen holders are held back**, not skipped silently: the script prints them so someone decides.
- **Coupons in the stablecoin** keep working during a global freeze of HBOND (Module 3), because they don't move HBOND.
- **Thousands of holders**: send in parallel with **Tickets** (\`TicketCreate\` reserves sequence numbers so several transactions can be in flight at once). The idempotency check stays the same.

### Why not pay with the DEX or a Hook?

You could let a Hook pay everyone when triggered, but a Hook can emit only a small number of transactions per execution, and a coupon run over thousands of holders is a batch job. Keep the run off-ledger, with the ledger as its memory.

### In the Xahau docs

- [Payment and Memos](https://docs.xahau.network/protocol-reference/transactions/transaction-types/payment/)
- [Common fields (Memos)](https://docs.xahau.network/protocol-reference/transactions/transaction-common-fields/)
- [TicketCreate](https://docs.xahau.network/protocol-reference/transactions/transaction-types/ticketcreate/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/41-pay-coupon.js" },
          language: "javascript",
          code: example("41-pay-coupon.js"),
        },
      ],
      slides: [
        {
          title: { en: "Idempotent Payouts" },
          content: { en: "Memo: coupon:<record ledger>\nBefore paying, read account_tx\nAlready tagged → skip\n\nRerun after a crash = safe" },
          visual: "🔁",
        },
      ],
    },
    {
      id: "m5l3",
      title: { en: "Setting Money Aside, and Why HBOND Can't Be Locked" },
      theory: {
        en: `Investors like to know the next coupon is **already there**. On Xahau the treasury can prove it by locking the money in an **escrow** that nobody can touch before a date.

### Escrow for tokens on Xahau

Xahau's \`PaychanAndEscrowForTokens\` amendment lets escrows hold issued tokens, not just XAH. \`EscrowCreate\` takes an \`Amount\` in USD, a \`Destination\`, and times in **ledger time** (seconds since 2000-01-01, which is Unix time minus 946,684,800):

- \`FinishAfter\`: the earliest moment \`EscrowFinish\` can release it.
- \`CancelAfter\`: after this, it can only be cancelled back to the owner.

The treasury escrows to **itself**: a reserve, not a payment. While it's locked, its trust line shows the amount as \`locked_balance\`, visible to anyone:

\`\`\`
✔ reserve 1000 USD for 40s: tesSUCCESS
  treasury USD: balance 4001.25, of which locked 1000
✘ release escrow 843283724: tecNO_PERMISSION
✔ release escrow 843283724: tesSUCCESS
  treasury USD: balance 4001.25, of which locked 0
\`\`\`

Released too early: \`tecNO_PERMISSION\`, nothing changes. After \`FinishAfter\`: released.

### The catch: tokens with clawback can't be escrowed

The obvious next idea is a **lock-up**: escrow investors' HBOND so they can't sell for a year. We tried:

\`\`\`
✘ escrow 10 HBOND (issuer has clawback): tecNO_PERMISSION
\`\`\`

Reading xahaud's source explains it. Before creating any locked token balance, it checks the issuer, and **refuses if the issuer has \`lsfAllowTrustLineClawback\` set**: clawback and locked balances can't coexist. USD worked because STABLE never enabled clawback.

So an RWA issuer on Xahau chooses, **once and forever**, before the first trust line:

| If you enable clawback | If you don't |
|---|---|
| Lost keys and court orders can be fixed | They can't: only a freeze and a new token would help |
| No token escrow: lock-ups need another tool | Token escrows work for lock-ups and vesting |

### Lock-ups without escrow

If you chose clawback, as Harbor Bond did:

- **Deliver late**: keep locked allocations in the treasury, or in a USD escrow for their purchase price, and deliver the tokens when the lock-up ends. Simple and honest.
- **Freeze until the date**: issue the tokens and freeze the holder's line until the lock-up ends. The holder can't sell (only return tokens to the issuer); lifting it is one transaction. The freeze is visible to everyone, which doubles as disclosure.
- **A Hook can't do it**: Module 9 shows the issuer's Hook can't block transfers between holders.

### In the Xahau docs

- [Escrow](https://docs.xahau.network/features/network-features/escrow/)
- [EscrowCreate](https://docs.xahau.network/protocol-reference/transactions/transaction-types/escrowcreate/)
- [EscrowFinish](https://docs.xahau.network/protocol-reference/transactions/transaction-types/escrowfinish/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/42-coupon-reserve.js" },
          language: "javascript",
          code: example("42-coupon-reserve.js"),
        },
        {
          title: { en: "examples/43-release-escrow.js" },
          language: "javascript",
          code: example("43-release-escrow.js"),
        },
      ],
      slides: [
        {
          title: { en: "Coupon Reserve" },
          content: { en: "Treasury escrows USD to itself\nlocked_balance: visible to all\nUntouchable before FinishAfter" },
          visual: "🏦",
        },
        {
          title: { en: "Clawback XOR Escrow" },
          content: { en: "Issuer with clawback → its token\ncan't be escrowed (tecNO_PERMISSION)\n\nLock-ups: deliver late, or freeze until date" },
          visual: "⚖️",
        },
      ],
    },
    {
      id: "m5l4",
      title: { en: "Maturity: an Atomic Redemption Window" },
      theory: {
        en: `At maturity every holder must get face value back, and every token must disappear. This is where we made the course's most instructive mistake.

### The first design: two payments

Our first redemption script did the obvious thing:

1. The holder pays its HBOND back to the issuer (tokens paid to their issuer are destroyed).
2. The treasury pays the holder face value in USD.

It ran like this:

\`\`\`
✔ bob: return 296.5 HBOND to the issuer: tesSUCCESS
✘ treasury: pay 29650 USD principal: tecPATH_PARTIAL
  BOB now holds 0 HBOND
\`\`\`

The treasury didn't have 29,650 USD. BOB had given up his bonds and received nothing. Two separate transactions are **not atomic**: the first can succeed and the second fail, and then someone is owed money and has to trust the issuer to pay it. (We paid BOB by hand afterwards. On mainnet that's a default.)

### The fix: let the DEX do delivery versus payment

At maturity, the treasury posts **one standing bid** for the whole outstanding supply at face value: "I give 100 USD for each HBOND". Each holder sells into it with Fill or Kill. HBOND and USD swap in the **same** transaction: full principal, or nothing moves.

In the verification run, the window first **refused to open**: the treasury had spent part of the money raised (coupons, the reserve) and was short. Once the asset-sale proceeds arrived, it opened and both holders redeemed:

\`\`\`
Outstanding: 810 HBOND. Principal due: 81000 USD. Treasury holds 5101.25 USD unlocked.
✘ Short by 75898.75 USD: fund the treasury first
✔ asset sale proceeds: tesSUCCESS
Outstanding: 810 HBOND. Principal due: 81000 USD. Treasury holds 105101.25 USD unlocked.
✔ redemption window: buy 810 HBOND at 100 USD: tesSUCCESS
✔ alice: redeem 504 HBOND for 50400 USD: tesSUCCESS
  ALICE: 0 HBOND, 57898.75 USD
✔ bob: redeem 306 HBOND for 30600 USD: tesSUCCESS
  BOB: 0 HBOND, 37000 USD
✔ retire 9950 HBOND: tesSUCCESS
  HBOND in existence: 0
\`\`\`

Three safeguards live in the scripts:

- **Refuse to open an unfunded window.** \`44-redemption-window.js\` compares the principal due with the treasury's **unlocked** USD before posting: money sitting in an escrow (lesson 3) shows in the trust line's balance but can't pay anyone. (If it posted anyway, the DEX would simply skip the unfunded part and each holder's Fill or Kill would fail cleanly: nobody could lose, but the promise would be broken in public.)
- **Fill or Kill on the holder's side**: all of their tokens at face value, or nothing.
- **Retire the supply.** After the window, the treasury holds the redeemed tokens plus any it never sold. \`46-retire-supply.js\` pays them all to the issuer, which destroys them. \`gateway_balances\` then reports no obligations: the bond has provably ceased to exist.

### Holders who don't show up

Some holders will miss the window. The bid stays on the book for them as long as the treasury keeps it funded, which is exactly what a paying agent does off-ledger. When the terms say claims expire, the issuer can freeze the remaining lines and, if it has clawback, clear them after paying through another channel.

### In the Xahau docs

- [OfferCreate](https://docs.xahau.network/protocol-reference/transactions/transaction-types/offercreate/)
- [gateway_balances](https://docs.xahau.network/features/http-websocket-apis/public-api-methods/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/44-redemption-window.js" },
          language: "javascript",
          code: example("44-redemption-window.js"),
        },
        {
          title: { en: "examples/45-redeem.js" },
          language: "javascript",
          code: example("45-redeem.js"),
        },
        {
          title: { en: "examples/46-retire-supply.js" },
          language: "javascript",
          code: example("46-retire-supply.js"),
        },
      ],
      slides: [
        {
          title: { en: "Two Payments ≠ Atomic" },
          content: { en: "Holder returns tokens ✔\nTreasury pays ✘ tecPATH_PARTIAL\n→ holder has nothing\n\nNever split DvP into two steps" },
          visual: "💥",
        },
        {
          title: { en: "Redemption Window" },
          content: { en: "Treasury bids face value for all supply\n(only if funded)\nHolders sell Fill or Kill\nRetire everything → supply 0" },
          visual: "🏁",
        },
      ],
    },
  ],
}

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

That's hex for \`coupon\` and \`coupon:12506512\`. Before paying, the script reads the treasury's own history (\`account_tx\`) and skips every holder that already received a successful payment with that tag.

### Payments in flight

\`account_tx\` shows only **validated** transactions. A payment the script submitted just before it crashed may still be on its way: not in the history yet, but about to validate. A rerun that trusted the history alone would pay that holder a second time.

So the script keeps a small **journal**. Before submitting each payment it writes the payment's hash and its \`LastLedgerSequence\` to \`coupon-journal.json\`, and only then sends it. On a rerun, for every journaled payment not yet in the history:

| The ledger says | The script |
|---|---|
| Validated with \`tesSUCCESS\` | Counts the holder as paid |
| Validated with a failure | Pays again |
| Not found, and \`LastLedgerSequence\` has passed | Pays again: after that ledger it can never validate |
| Not found, \`LastLedgerSequence\` not reached | Leaves the holder alone and asks you to run again in a few seconds |

\`LastLedgerSequence\` is what makes the third row safe: \`autofill\` sets it a few ledgers ahead, and a transaction not validated by then is dead for good. The history and the journal together cover every moment of a crash.

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
- **Coupons in the stablecoin** keep working during a global freeze of HBOND ([Module 3](?m=3&l=2)), because they don't move HBOND.
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
          content: { en: "Memo: coupon:<record ledger>\nJournal hash + LastLedgerSequence, then send\nRerun: validated → skip · expired → retry\nin flight → wait\n\nRerun after a crash = safe" },
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

Many offerings require a **lock-up**: investors' tokens can't be sold for a period. With a token whose issuer has clawback, escrow can't provide it:

\`\`\`
✘ escrow 10 HBOND (issuer has clawback): tecNO_PERMISSION
\`\`\`

The reason is a rule in xahaud: before creating any locked token balance, it checks the issuer and **refuses if the issuer has \`lsfAllowTrustLineClawback\` set**: clawback and locked balances can't coexist. USD worked because STABLE never enabled clawback.

So an RWA issuer on Xahau chooses, **once and forever**, before the first trust line:

| If you enable clawback | If you don't |
|---|---|
| Lost keys and court orders can be fixed | They can't: only a freeze and a new token would help |
| No token escrow: lock-ups need another tool | Token escrows work for lock-ups and vesting |

### Lock-ups without escrow

If you chose clawback, as Harbor Bond did:

- **Deliver late**: keep locked allocations in the treasury, or in a USD escrow for their purchase price, and deliver the tokens when the lock-up ends. Simple and honest.
- **Freeze until the date**: issue the tokens and freeze the holder's line until the lock-up ends. The holder can't sell (only return tokens to the issuer); lifting it is one transaction. The freeze is visible to everyone, which doubles as disclosure.
- **A lockbox with a Hook**: move the tokens to a dedicated vault account whose Hook lets them out only on the release date, while the issuer keeps its clawback. The issuer's own Hook couldn't do this, since it can't block transfers between holders; a Hook on the account that **holds** the tokens can. [Module 9](?m=9&l=3) builds it.

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
          content: { en: "Issuer with clawback → its token\ncan't be escrowed (tecNO_PERMISSION)\n\nLock-ups: deliver late, freeze until date,\nor a lockbox Hook (Module 9)" },
          visual: "⚖️",
        },
      ],
    },
    {
      id: "m5l4",
      title: { en: "Maturity: an Atomic Redemption Window" },
      theory: {
        en: `At maturity every holder must get face value back, and every token must disappear. The exchange has to be **atomic**: the holder gives up the bonds and receives the principal in the same step, or neither happens.

### Why two payments are not enough

The intuitive design uses two transactions:

1. The holder pays its HBOND back to the issuer (tokens paid to their issuer are destroyed).
2. The treasury pays the holder face value in USD.

If the treasury is short when the second one runs, the result is this (balances in this module depend on which earlier demos you ran, so yours will differ):

\`\`\`
✔ bob: return 296.5 HBOND to the issuer: tesSUCCESS
✘ treasury: pay 29650 USD principal: tecPATH_PARTIAL
  BOB now holds 0 HBOND
\`\`\`

BOB has given up his bonds and received nothing. Two separate transactions are **not atomic**: the first can succeed and the second fail, and the holder is left trusting the issuer to pay. On mainnet that is a default. Don't ask holders to redeem with two payments.

### The correct design: delivery versus payment on the DEX

At maturity, the treasury posts **one standing bid** for the whole outstanding supply at face value: "I give 100 USD for each HBOND". Each holder sells into it with Fill or Kill. HBOND and USD swap in the **same** transaction: full principal, or nothing moves.

The treasury's unsold primary offer from [Module 4](?m=4&l=1) is still on the book, selling HBOND for USD at the same price. The bid would cross it, and when two offers from the same account cross, the ledger removes the older one. \`44-redemption-window.js\` cancels it explicitly first: at maturity the primary sale is over, and a script should say what it removes.

Before opening the window, make sure the treasury can pay the **whole** principal. By maturity it has usually spent part of what it raised (on the asset, coupons, the reserve), so the principal comes from selling or refinancing the asset. \`44-redemption-window.js\` refuses to open until the money is there. Here it refuses, the asset-sale proceeds arrive, and then both holders redeem:

\`\`\`
Outstanding: 810 HBOND. Principal due: 81000 USD. Treasury holds 5101.25 USD unlocked.
✘ Short by 75898.75 USD: fund the treasury first
✔ asset sale proceeds: tesSUCCESS
Outstanding: 810 HBOND. Principal due: 81000 USD. Treasury holds 105101.25 USD unlocked.
✔ close the primary offer (4949 HBOND unsold): tesSUCCESS
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
- **Retire the supply.** After the window, the treasury holds the redeemed tokens plus any it never sold. \`46-retire-supply.js\` pays them all to the issuer, which destroys them. \`gateway_balances\` then reports no obligations and no frozen balances: the bond has provably ceased to exist. (Check both: with a frozen holder left, \`obligations\` alone would already read zero. The window is sized with the frozen holdings too, since those holders are still owed principal, paid through the issuer as described below.)

### Frozen holders

A frozen holder can't use the window: their offers to sell HBOND count as unfunded. That covers a regular freeze, a deep freeze, a holder frozen by the holding cap ([Module 9](?m=9&l=2)) and one frozen for sanctions. For them the issuer runs the two steps itself, in the order that never leaves the holder empty-handed:

1. The treasury pays the principal in USD (HBOND's freeze doesn't touch the USD line).
2. The issuer **claws back** the tokens ([Module 3](?m=3&l=3)), which destroys them.

The issuer controls both steps, so nobody depends on the frozen holder signing anything, and the holder is paid before losing the bonds. Where sanctions forbid paying the holder at all, the principal waits for the authorities' decision; the tokens stay frozen meanwhile.

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
          content: { en: "Holder returns tokens ✔\nTreasury pays ✘ tecPATH_PARTIAL\n→ holder has nothing\n\nDon't make holders redeem in two steps" },
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

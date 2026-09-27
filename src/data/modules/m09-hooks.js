import { example } from '../example-code.js'

export default {
  id: "m9",
  icon: "🪝",
  title: { en: "Hooks for Compliance" },
  lessons: [
    {
      id: "m9l1",
      title: { en: "What a Hook Can Stop, and What It Can't" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **Hook** | A small WebAssembly program installed on an account with \`SetHook\`. It runs when a transaction involves that account. |
| **HookOn** | The transaction types that trigger the Hook (Payment, OfferCreate, Invoke…). |
| **accept / rollback** | How a Hook finishes: \`accept\` lets the transaction through, \`rollback\` refuses it (\`tecHOOK_REJECTED\`). |
| **Stakeholder** | An account involved in a transaction. Its Hook may be run, as a **strong** or a **weak** stakeholder. |
| **Collect call** | An account's agreement to pay the fees for its Hook's weak executions. Without it, weak executions don't happen. |
| **Emit** | A Hook sending a new transaction from its own account. |

Any other term: see the [Glossary](?m=0&l=9).

### What a Hook is

A Hook is code attached to an account. The account installs it once with a \`SetHook\` transaction, and from then on the ledger runs it whenever a transaction of a type listed in \`HookOn\` involves that account. The Hook can read the transaction and the ledger, keep its own small key-value state, send transactions of its own (**emit**), and decide the transaction's fate with \`accept\` or \`rollback\`.

That last power is what makes Hooks interesting for an issuer. A token with rules (only verified investors, a maximum holding, no transfers during a lock-up) seems to call for a Hook on the issuer that refuses every transfer breaking them. Whether that works depends on one question: **for which transactions does the ledger ask the issuer's Hook, and when?**

### Strong and weak stakeholders

Take a payment of 1 HBOND from ALICE to BOB. Three accounts are involved:

- **ALICE**, the sender, and **BOB**, the destination, are **strong** stakeholders. Their Hooks run **before** the payment is applied, and a \`rollback\` from either one cancels it.
- **The ISSUER** is only a **weak** stakeholder. HBOND balances live on trust lines with the issuer, so the payment touches its lines, but it neither sends nor receives anything. Its Hook runs only if the issuer has enabled a **collect call** (\`asfTshCollect\` on the account and \`hsfCollect\` on the Hook), and even then it runs **after** the payment has been applied. Its \`rollback\` is ignored.

A payment from ALICE **to** the issuer is different: there the issuer is the destination, a strong stakeholder, and its Hook can refuse.

### Seeing it on the ledger

\`hooks/probe.c\` is the simplest Hook that shows the difference. It lets the account's own transactions through and refuses everything else. \`who-sees-what.js\` installs it on the ISSUER, has ALICE send 1 HBOND to BOB and then 1 HBOND to the issuer, and removes it again:

\`\`\`
✔ install probe: tesSUCCESS
✔ alice -> bob 1 HBOND: tesSUCCESS
✘ alice -> issuer 1 HBOND: tecHOOK_REJECTED  [hook] Probe: refused by the issuer's Hook. 
✔ remove probe: tesSUCCESS
\`\`\`

- **ALICE → BOB succeeds.** The probe refuses everything, yet it never ran: without a collect call, the ledger doesn't ask a weak stakeholder at all.
- **ALICE → ISSUER is refused** with \`tecHOOK_REJECTED\`. The issuer is the destination, so the probe ran before the payment and rolled it back. ALICE still pays the transaction fee, as for any \`tec\` result.

With a collect call enabled, the probe would run on ALICE → BOB too, but only after the payment is applied, so its \`rollback\` would change nothing: the payment stands. [Lesson 3](?m=9&l=2) builds on exactly this behaviour to react right after a transfer.

### What this means for an RWA issuer

**An issuer's Hook can't block transfers of its token between holders.** Rules about who may hold HBOND belong to the ledger's own controls, which apply to every transfer before any Hook is consulted: \`RequireAuth\` and authorised trust lines, freeze and deep freeze, and clawback as the remedy ([Module 3](?m=3&l=0)).

Hooks remain very useful. They work best on accounts the issuer runs, where they are strong stakeholders, and as a way to react after the fact:

| Pattern | Where the Hook lives | Stakeholder | Lesson |
|---|---|---|---|
| Accept, refuse or answer payments **to** an account you run | That account (a treasury, a sales desk) | Strong | [Lesson 2](?m=9&l=1) |
| React **after** a transfer between holders (freeze, record, alert) | The issuer, with a collect call | Weak | [Lesson 3](?m=9&l=2) |
| Control what **leaves** an account that holds tokens for others | That account (a vault) | Strong | [Lesson 4](?m=9&l=3) |
| Rules on an investor's **own** account (custody limits) | The investor's account | Strong, but the investor installs it | - |

### In the Xahau docs

- [Hooks introduction](https://docs.xahau.network/hooks/concepts/introduction/)
- [Weak and strong stakeholders](https://docs.xahau.network/hooks/concepts/weak-and-strong/)
- [Collect call](https://docs.xahau.network/hooks/concepts/collect-call/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/hooks/probe.c" },
          language: "c",
          code: example("hooks/probe.c"),
        },
        {
          title: { en: "examples/hooks/who-sees-what.js" },
          language: "javascript",
          code: example("hooks/who-sees-what.js"),
        },
      ],
      slides: [
        {
          title: { en: "Who Gets Asked" },
          content: { en: "Holder → issuer: issuer is STRONG → can refuse\nHolder → holder: issuer is WEAK\n→ not asked, or asked after (collect call)\n→ can't refuse" },
          visual: "🎣",
        },
        {
          title: { en: "So Hooks Can…" },
          content: { en: "Guard accounts you run (strong)\nReact after transfers (weak)\nGuard a vault's outflow (strong)\n\nNot: veto holder-to-holder transfers" },
          visual: "🧭",
        },
      ],
    },
    {
      id: "m9l2",
      title: { en: "A Subscription Desk: Pay USD, Receive HBOND" },
      theory: {
        en: `[Module 4](?m=4&l=1) sold HBOND with a DEX offer. Some investors (and their compliance teams) prefer a plain instruction: "send USD to this address". A Hook on the TREASURY makes that safe in three steps: it checks everything it can **before** the USD moves, it **emits** the HBOND delivery, and if that delivery fails, its **callback** pays the USD back.

That is not the same guarantee as the DEX. A DEX trade swaps both sides in **one** transaction. Here the delivery is a **second** transaction, applied a ledger or two later, and a lot can happen in between. The desk is built so that a failure ends with the investor holding either the tokens or their USD back; only if the refund fails too does it fall to the operations team, with the debt recorded on the ledger.

### What the desk checks

The treasury is the destination of the investor's payment, so its Hook is a **strong** stakeholder: whatever it refuses never happens, and the investor keeps their USD.

1. **The currency** is the configured USD, from the configured issuer. Anything else: refused.
2. **No partial payments.** With \`tfPartialPayment\`, a payment's \`Amount\` is only a maximum and less may arrive; a desk that trusted \`Amount\` would over-deliver. Refused.
3. **The sender can receive HBOND**: it has a trust line to the issuer, **authorised**, not deep-frozen, with a limit that leaves room for the new tokens. The Hook reads that trust line with \`util_keylet(KEYLET_LINE, …)\` and checks the issuer's flags on it (\`lsfLowAuth\` or \`lsfHighAuth\`, depending on which account ID is numerically lower, and the same for the freeze flags).
4. **The token can move**: the issuer hasn't frozen it globally and charges no transfer fee (a fee would need a \`SendMax\` the simple delivery doesn't carry).
5. **The treasury has enough HBOND left**, counting only stock not already promised to earlier subscriptions whose delivery is still on its way.

Then it **emits** a payment of \`USD ÷ PRICE\` HBOND back to the sender. XAH payments, payments of HBOND itself (the issuer restocking the treasury, a holder returning tokens) and the treasury's own transactions (including that emitted payment, which triggers the Hook again) pass untouched.

### Reserving stock, and the callback

Two subscriptions can arrive in the same ledger. Both would see the same treasury balance, because neither delivery has happened yet. So the Hook keeps a running total in its **state**, under the key \`RESERVED\`: every accepted subscription adds its units, and check 5 subtracts the total from the balance. It also stores each pending delivery under the emitted payment's hash: who paid, how much USD, how many tokens.

A Hook can export a second function, \`cbak\`, that the ledger runs once a transaction it emitted has been applied, **whatever its result**, or has expired unapplied. The desk's \`cbak\`:

1. Finds the pending delivery by the emitted payment's hash (\`otxn_id\` inside \`cbak\` is the emitted transaction).
2. Reads the result from the emitted transaction's metadata (\`meta_slot\`, field \`sfTransactionResult\`, where \`0\` is \`tesSUCCESS\`).
3. Releases the reservation either way.
4. If the delivery failed, **emits a refund** of the USD, and follows that refund too. If even the refund fails, it records the amount owed in state, under the investor's account, for the operations team.

A delivery can fail even after every check passed: the treasury's resting DEX offer sold the stock in the meantime, the investor lowered their trust line limit, the issuer deep-froze the line. \`npm run verify\` forces one: ALICE pays 500 USD and, in the same ledger, lowers her HBOND limit to what she already holds. The delivery fails and the callback refunds the 500 USD.

### Preparing a subscriber

The desk accepts a subscription only from an account that can both pay and receive:

- a **USD trust line** holding at least the amount it sends ([Module 4](?m=4&l=0));
- an **HBOND trust line the issuer has authorised** ([Module 3](?m=3&l=0)).

ALICE, BOB and CAROL were set up in those modules. For any other role, or after starting over with new accounts, \`prepare-subscriber.js\` does both and skips whatever is already in place. With \`--no-kyc\` it opens the HBOND line but leaves it unapproved, which reproduces the desk's KYC refusal. Each refusal points at the missing step:

| The desk says | What is missing | Run |
|---|---|---|
| "open a trust line for the token first" | The account has no HBOND trust line | \`node hooks/prepare-subscriber.js <ROLE>\` |
| "your trust line is not authorised yet (KYC pending)" | The issuer hasn't approved the line | \`node hooks/prepare-subscriber.js <ROLE>\` (without \`--no-kyc\`) |
| "subscription accepted", yet the payment fails with \`tecPATH_PARTIAL\` | Not enough USD, or no USD trust line | \`node hooks/prepare-subscriber.js <ROLE> --usd <amount>\` |

The last row deserves a note. The desk doesn't check the sender's balance, so its Hook accepts; the payment itself then fails for lack of funds. A failed transaction discards everything its Hooks emitted, so no HBOND is delivered and no USD moves: the investor loses only the fee.

Leave CAROL unapproved: this lesson relies on her being refused.

### Running it

\`\`\`
✔ install subscription_desk: tesSUCCESS
✔ alice pays 1000 USD to the desk: tesSUCCESS  [hook] Desk: subscription accepted, tokens on the way.
  ALICE: 478 -> 488 HBOND
✘ carol pays 1000 USD to the desk: tecHOOK_REJECTED  [hook] Desk: your trust line is not authorised yet (KYC pending).
✘ bob pays 500 USD to the desk: tecHOOK_REJECTED  [hook] Desk: partial payments are refused.
\`\`\`

The emitted payment is a **separate transaction**, validated a ledger or two later; the script polls for the balance change, and reports a refund if the USD comes back instead. Two more cases behave as designed: 250 USD buys 2.5 HBOND (issued tokens are divisible, so the desk doesn't need to round), and a plain XAH payment to the treasury passes with "Desk: XAH received, not a subscription."

### Removing the desk

The callback runs only while the Hook is installed. \`install-subscription-desk.js --remove\` therefore refuses while the Hook's state still holds anything (\`account_namespace\` lists it): a reservation or a pending delivery means a refund might still be needed. Wait a few ledgers and remove it then.

What never settles on its own is a **debt**: a refund that failed, recorded under the investor's account. The operations team pays it by hand, then removes the desk with \`--remove --clear-state\`, which first deletes the Hook's state (\`SetHook\` with \`hsfNSDelete\` and the Hook's namespace).

### Parameters, not constants

The currency, the token and the price are **HookParameters** given at install time (\`USD\`, \`TOK\`, \`PRICE\`), so the same compiled Hook serves any token and changing the price is a new \`SetHook\`, not a new build. The capstone installs this exact file for a differently named bond.

### In the Xahau docs

- [Emitted transactions](https://docs.xahau.network/hooks/concepts/emitted-transactions/)
- [Hook parameters](https://docs.xahau.network/hooks/concepts/parameters/)
- [HookOn](https://docs.xahau.network/hooks/concepts/hookon-field/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/hooks/subscription_desk.c" },
          language: "c",
          code: example("hooks/subscription_desk.c"),
        },
        {
          title: { en: "examples/hooks/lib.js" },
          language: "javascript",
          code: example("hooks/lib.js"),
        },
        {
          title: { en: "examples/hooks/install-subscription-desk.js" },
          language: "javascript",
          code: example("hooks/install-subscription-desk.js"),
        },
        {
          title: { en: "examples/hooks/prepare-subscriber.js" },
          language: "javascript",
          code: example("hooks/prepare-subscriber.js"),
        },
        {
          title: { en: "examples/hooks/subscribe-via-desk.js" },
          language: "javascript",
          code: example("hooks/subscribe-via-desk.js"),
        },
      ],
      slides: [
        {
          title: { en: "Desk Checks, Then Delivers" },
          content: { en: "✔ right USD, right issuer\n✘ partial payments\n✔ sender's line: authorised, room, not deep-frozen\n✔ unreserved stock is enough\n→ reserve, emit HBOND = USD ÷ PRICE" },
          visual: "🏦",
        },
        {
          title: { en: "The Callback" },
          content: { en: "cbak runs when the delivery settles\nmeta_slot → sfTransactionResult\nDelivered: release the reservation\nFailed: release it and refund the USD" },
          visual: "↩️",
        },
      ],
    },
    {
      id: "m9l3",
      title: { en: "A Holding Cap: React in the Same Breath" },
      theory: {
        en: `Many securities limit how much one investor may hold (a concentration limit, or a cap that keeps an offering under a legal threshold). Lesson 1 showed the issuer can't **block** a transfer that breaks it. It can **react**: detect it right after, and freeze the receiver.

### How holding_cap works

Installed on the ISSUER with a collect call (\`asfTshCollect\` + \`hsfCollect\`), with \`HookOn\` set to **every transaction type**. The issuer becomes a weak stakeholder of any transaction that changes a balance of its token, so the Hook runs after each one, whatever its type.

Don't work out from the transaction's fields who received tokens. Tokens move in many ways, and several have no "receiver" field: a Payment whose \`Amount\` names the destination as issuer ("any issuer the destination trusts"), a \`CheckCash\`, a \`Remit\`, a payment channel claim, a URIToken bought with HBOND, a sell order that fills someone's **resting bid**. Read the **result** instead:

1. Ignore the issuer's own transactions.
2. Load the transaction's metadata with \`meta_slot\` (weak executions run after the transaction, so it's there) and walk \`AffectedNodes\`.
3. For each trust line of HBOND with this issuer, work out the holder from the two limits, and its balance before (\`PreviousFields\`) and after (\`FinalFields\`).
4. If the balance went **up** and is now above \`MAX\`, and the holder isn't already frozen or **exempt**, **emit a \`TrustSet\` with \`tfSetFreeze\`** on that line (up to four per transaction).

\`EXEMPT\` is an optional install parameter: account IDs the cap never freezes. The installer passes the TREASURY (it holds the unsold supply and buys everything back at maturity) and the VAULT if there is one.

\`\`\`
✔ asfTshCollect: tesSUCCESS
✔ install holding_cap: tesSUCCESS
✔ bob -> alice: 5 HBOND: tesSUCCESS  [hook] Cap: within the limit.
✔ bob -> alice: 10 HBOND: tesSUCCESS  [hook] Cap: limit exceeded, receiver frozen.
  BOB      306
  ALICE    503
✘ alice -> bob: 1 HBOND: tecPATH_DRY
✔ alice: buy 1 HBOND at ≤ 101 USD: tesSUCCESS  [hook] Cap: limit exceeded, receiver frozen.
  ALICE now holds 504 HBOND and 7498.75 USD
\`\`\`

The 10-token transfer took ALICE over the cap of 500, and the Hook froze her: her next attempt to send fails with \`tecPATH_DRY\`. The compliance team then unfroze her (\`22-freeze.js ALICE --off\`, not shown), and she received more HBOND by two other routes: a payment whose \`Amount\` names her as the issuer, and a purchase **on the DEX**. The Hook caught both and froze her again each time. As [Module 3](?m=3&l=1) showed, a frozen holder can still return tokens to the issuer, so the fix is in her hands.

The route through \`Amount\` deserves a look, because a Hook that checked the transaction's fields would miss it. With a cap of 12, BOB pays ALICE 5 HBOND, naming ALICE as the amount's issuer and the real issuer in \`SendMax\`:

\`\`\`
✔ bob -> alice 5 HBOND (Amount.issuer: alice): tesSUCCESS  [hook] Cap: limit exceeded, receiver frozen.
alice 15 frozen by issuer: true
\`\`\`

\`Amount.issuer\` isn't the token's issuer, yet HBOND moved. The metadata shows ALICE's line going up, and that is what the Hook reads.

### Building a transaction by hand in C

The Hooks headers have a ready-made macro for a payment, not for a \`TrustSet\`, so \`holding_cap.c\` serialises one field by field: type, flags, sequence 0, first/last ledger, \`LimitAmount\` (a zero amount of HBOND whose "issuer" is the holder), fee, an empty signing key, the account, and finally \`EmitDetails\` from \`etxn_details\`.

It builds that transaction inside a loop over the affected lines, which matters for **guards**. Every loop needs \`GUARD(n)\`, and \`n\` counts iterations over the **whole** execution, not per pass of an outer loop. The headers' macros hide loops of their own (\`ENCODE_TL\` copies 48 bytes with a guard of 48; \`BUFFER_EQUAL\` and \`ACCOUNT_COMPARE\` loop too), so the second pass through such a macro breaks its guard and the Hook is rolled back. \`holding_cap.c\` compares and copies its 20- and 48-byte values with plain word reads instead.

Size the \`EmitDetails\` buffer with care: \`etxn_details\` **refuses a buffer shorter than 116 bytes** (138 with a callback), even though it writes only 115. A buffer sized to what it writes makes \`emit\` fail with \`EMISSION_FAILURE\` (-11).

### Costs and limits

- A **collect call** means the issuer pays the fee for every weak execution: every HBOND transfer between holders now costs the issuer a little XAH. Keep the Hook small.
- There's a gap between the transfer and the freeze: the emitted \`TrustSet\` lands a ledger or two later, and until then the receiver isn't frozen and could pass the tokens on. The rule is **reactive**, not preventive, and your terms should say so.
- **\`HookOn\` must cover every type.** A Hook listening to \`Payment\` alone never runs on a DEX purchase, a check or a Remit, so a buyer could take 600 tokens with a cap of 500. Reading the metadata only helps if the Hook runs at all.
- A transaction that touches more than 32 ledger objects, or pushes more than four holders over the cap at once, is only partly examined. Size those limits to your token.

### In the Xahau docs

- [Collect call](https://docs.xahau.network/hooks/concepts/collect-call/)
- [Emitted transactions](https://docs.xahau.network/hooks/concepts/emitted-transactions/)
- [Weak and strong stakeholders](https://docs.xahau.network/hooks/concepts/weak-and-strong/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/hooks/holding_cap.c" },
          language: "c",
          code: example("hooks/holding_cap.c"),
        },
        {
          title: { en: "examples/hooks/install-holding-cap.js" },
          language: "javascript",
          code: example("hooks/install-holding-cap.js"),
        },
      ],
      slides: [
        {
          title: { en: "Reactive Compliance" },
          content: { en: "Issuer Hook, collect call (weak), HookOn: all\nRead the metadata: which lines went up?\nAbove MAX → emit TrustSet tfSetFreeze\n\nCan't block. Can freeze a ledger later." },
          visual: "🧯",
        },
        {
          title: { en: "EMISSION_FAILURE (-11)" },
          content: { en: "etxn_details needs ≥ 116 bytes\n(138 with a callback)\n\nIt writes 115: size the buffer to 116" },
          visual: "📏",
        },
      ],
    },
    {
      id: "m9l5",
      title: { en: "A Lockbox: Time Locks for a Token with Clawback" },
      theory: {
        en: `[Module 5](?m=5&l=2) showed that Xahau refuses to escrow HBOND: its issuer has clawback, and the ledger won't create a locked balance that a clawback could pull out from under. A lock-up still needs *something* that holds the tokens until a date and can't be talked out of it.

[Lesson 1](?m=9&l=0) explains why the issuer's own Hook can't be that thing: the issuer is only a weak stakeholder of transfers between holders. But the account that **holds** the tokens is a strong stakeholder of everything it sends. So the lock lives on a dedicated **VAULT** account: every HBOND in it is locked HBOND, and its Hook is the only way out.

### How the lockbox works

| Step | Transaction | What the Hook does |
|---|---|---|
| **Lock** | A payment of HBOND to the vault, carrying two transaction \`HookParameters\`: \`BEN\` (who receives) and \`AFTER\` (when, in ledger time) | Checks both, checks the beneficiary has an **authorised** trust line, and records the lock in its state under the payment's hash. Refuses otherwise, so nothing moves |
| **Release** | An **Invoke** to the vault with \`ID\` = the lock's hash. Anyone may send it, like \`EscrowFinish\` | Once ledger time passes \`AFTER\`, emits the payment to the beneficiary and marks the lock "releasing". Too early: refused |
| **Settle** | None: the ledger runs the Hook's \`cbak\` once the release payment has been applied | Delivered: deletes the lock. Failed: marks it "locked" again, so it can be released once the cause is fixed |
| **Void** | An Invoke from the **issuer** with \`ID\` and \`OP = VOID\` | Deletes the lock without paying anyone: the step after a clawback |

An **Invoke** is a transaction that does nothing except run the Hooks of its \`Destination\`: the natural way to ask a Hook to act.

### The only way out

The Hook is installed with \`HookOn\` set to **every** transaction type. A list of types (Payment, OfferCreate, CheckCreate…) always leaves some route out: a \`Remit\`, or a URIToken bought with HBOND, would move locked tokens without the Hook ever running. With every type, the vault's own transactions are refused unless:

- the Hook emitted them (a release);
- they move only XAH (fees and reserves);
- they only manage keys: \`AccountSet\`, \`SetRegularKey\`, \`SignerListSet\`. These are what you need to put the vault's key out of reach, and they can't move tokens.

Incoming transactions other than payments and invokes are refused too, so nothing but a lock ever brings tokens into the vault.

### Releases that fail

The release payment is a separate transaction, and it can fail after the Hook has emitted it: the beneficiary's line deep-frozen or full, a global freeze, the vault's line frozen. If the Hook deleted the lock when emitting, the tokens would stay in the vault with no lock to release them. So the Hook checks what it can before emitting (authorised, not deep-frozen, vault not frozen, no global freeze, no transfer fee) and keeps the lock until its \`cbak\` has read the payment's result from the metadata (\`meta_slot\`, \`sfTransactionResult\`). While a release is in flight, a second release or a void is refused.

### Setting it up

\`install-lockbox.js\` creates the vault (it saves the new seed to \`.env\` first, then sends it 50 XAH from the treasury), gives it an authorised HBOND trust line like any holder, and installs \`lockbox.wasm\` with one install parameter, \`TOK\`, the currency and issuer it guards:

\`\`\`
  VAULT rKB6UwZ6GV9zcRwNEgjF1QcDmmjyGZqJiT (seed saved to .env)
✔ create VAULT with 50 XAH: tesSUCCESS
✔ vault: trust line: tesSUCCESS
✔ issuer: authorise vault: tesSUCCESS
✔ install lockbox: tesSUCCESS
\`\`\`

### A lock-up, and what it refuses

BOB agrees to a lock-up: 20 of his HBOND can't move for 40 seconds (a year, on mainnet):

\`\`\`
✔ bob locks 20 HBOND for bob: tesSUCCESS  [hook] Lock: tokens locked.
  lock 3C2A7B2FDCB4782B850EABEA3AA54ED0BFC4F1D7451C418805CD9EC08151DAA3
✘ alice locks 5 HBOND for carol: tecHOOK_REJECTED  [hook] Lock: the beneficiary has no authorised trust line for the token.
✘ vault -> bob: 1 HBOND: tecHOOK_REJECTED  [hook] Lock: locked tokens leave the vault only through a release.
✘ alice: release lock 3C2A7B2F…: tecHOOK_REJECTED  [hook] Lock: too early, the release time has not come.
\`\`\`

A lock for CAROL is refused before the tokens move, because she could never receive them. The vault's own key can't spend them. Asking for the release early changes nothing.

### Clawback still works

This is what an escrow couldn't offer. ALICE locks 10 HBOND for BOB, and a court orders the transfer undone. The issuer claws the tokens back **from the vault**, voids the lock so it can't be released from other locks' tokens, and issues 10 HBOND to ALICE again:

\`\`\`
✔ alice locks 10 HBOND for bob: tesSUCCESS  [hook] Lock: tokens locked.
✔ claw back 10 HBOND from vault: tesSUCCESS
  VAULT: 30 -> 20 HBOND
✘ bob: void lock DF3016D0…: tecHOOK_REJECTED  [hook] Lock: only the token's issuer can void a lock.
✔ issuer: void lock DF3016D0…: tesSUCCESS  [hook] Lock: voided by the issuer.
✔ issuer -> alice: 10 HBOND: tesSUCCESS
\`\`\`

If the issuer forgets to void, the Hook still protects the other locks: before releasing, it checks that the vault holds at least the lock's amount.

### The release

When the time comes, anyone can ask. ALICE does, and BOB gets his 20 back:

\`\`\`
  lock: 20 HBOND for r4atyCGrj45rBGji8B6NVPCoXV17JayZUf, after 2026-09-26T06:11:29.000Z
✔ alice: release lock 3C2A7B2F…: tesSUCCESS  [hook] Lock: released, tokens on the way.
  beneficiary: 280 -> 300 HBOND
  vault holds 0 HBOND
✘ alice: release lock 3C2A7B2F…: tecHOOK_REJECTED  [hook] Lock: no such lock, or it was already released or voided.
\`\`\`

\`release-lock.js\` reads the lock straight from the Hook's state (\`ledger_entry\` with \`hook_state\`) before asking, so anyone can check a lock's terms, and whether a release is in flight, without trusting the issuer's word.

\`npm run verify\` makes a release fail before that one: BOB asks for it and, in the same ledger, lowers his HBOND limit to what he already holds. The emitted payment fails, the callback puts the lock back, and the release above finds it intact.

### Compared with an escrow

| | Native escrow | Lockbox Hook |
|---|---|---|
| Works for a token with clawback | No (\`tecNO_PERMISSION\`) | Yes |
| Issuer can claw back locked tokens | Not applicable | Yes, from the vault |
| Who enforces the lock | The ledger itself | The Hook, as long as it stays installed |
| Where the tokens sit | In the owner's account, marked locked | In the vault's account |

The last two rows are the price. Whoever holds the vault's key can **remove the Hook** and then move the tokens. For a lock investors can rely on, put the key out of reach once the Hook is installed: a signer list whose signers include an independent party ([Module 8](?m=8&l=1)), and ideally a disabled master key. The course keeps the key so you can re-run and remove the lesson.

Testnet already runs the **HookOnV2** amendment, not yet enabled on mainnet. It adds \`HookOnIncoming\` and \`HookOnOutgoing\`, which choose the transaction types that fire a Hook separately for when the account is the destination and when it is the source. Once it is on mainnet, \`HookOnOutgoing\` set to every type is the natural way to express "nothing leaves the vault unless the Hook agrees", with the direction checked by the ledger instead of the Hook's code.

### Build it yourself

\`\`\`
sh hooks/build.sh lockbox
\`\`\`

\`build.sh\` exports \`hook\` and, when the source has one, \`cbak\`. \`hook-cleaner\` keeps only those two and drops any other function, so a helper function must be inlined (\`__attribute__((always_inline))\` in \`lockbox.c\`), or the install fails with \`temMALFORMED\`. A Hook with a \`cbak\` defines \`HAS_CALLBACK\` before including the headers: its emitted transactions carry a callback, and \`EmitDetails\` grows from 116 to 138 bytes. The bundled headers also lack \`otxn_param\`, the call that reads a transaction's parameters; \`lockbox.c\` declares it.

### In the Xahau docs

- [Invoke](https://docs.xahau.network/protocol-reference/transactions/transaction-types/invoke/)
- [Hook state](https://docs.xahau.network/hooks/concepts/state-management/)
- [Parameters](https://docs.xahau.network/hooks/concepts/parameters/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/hooks/lockbox.c" },
          language: "c",
          code: example("hooks/lockbox.c"),
        },
        {
          title: { en: "examples/hooks/install-lockbox.js" },
          language: "javascript",
          code: example("hooks/install-lockbox.js"),
        },
        {
          title: { en: "examples/hooks/lock-tokens.js" },
          language: "javascript",
          code: example("hooks/lock-tokens.js"),
        },
        {
          title: { en: "examples/hooks/release-lock.js" },
          language: "javascript",
          code: example("hooks/release-lock.js"),
        },
      ],
      slides: [
        {
          title: { en: "The Vault Holds, the Hook Guards" },
          content: { en: "Lock: pay HBOND to VAULT with BEN + AFTER\nRelease: Invoke with ID, after AFTER\ncbak: delivered → delete, failed → keep\nVoid: issuer only, after a clawback\n\nHookOn: all. The vault's key can't spend" },
          visual: "🔐",
        },
        {
          title: { en: "Escrow vs Lockbox" },
          content: { en: "Escrow: refused when the issuer has clawback\nLockbox: works, and clawback still reaches it\n\nPrice: trust the Hook stays installed" },
          visual: "⚖️",
        },
      ],
    },
    {
      id: "m9l4",
      title: { en: "Building and Shipping Your Own Hooks" },
      theory: {
        en: `### From C to an installable Hook

A Hook written in C becomes installable in two steps:

1. **Compile to WebAssembly** with a C compiler that can target \`wasm32\`. Any recent clang (LLVM) built with the WebAssembly target does; how you install one depends on your operating system, and the tools below can do this step for you.
2. **Clean the result** with [hook-cleaner](https://github.com/XRPLF/hook-cleaner-c), which removes the exports the Hooks VM doesn't accept. A Hook that skips this step is rejected even if its code is valid.

The course's \`build.sh\` runs both steps with the Hooks API headers in \`hooks/include/\`. Point \`CLANG\` and \`HOOK_CLEANER\` at your tools if they aren't on your \`PATH\`:

\`\`\`bash
sh hooks/build.sh subscription_desk    # → hooks/subscription_desk.wasm
\`\`\`

It compiles with \`-mcpu=mvp\` because newer compilers emit WebAssembly features the Hooks VM rejects, and \`SetHook\` would then fail with \`temMALFORMED\`. You don't need to build anything to follow the course: the compiled \`.wasm\` files are included.

### Tools for building Hooks

| Tool | What it gives you |
|---|---|
| [Hooks Builder](https://builder.xahau.network/) | An online IDE: write a Hook, compile it, test it and deploy it on testnet from the browser, with nothing to install |
| [Hooks CLI](https://github.com/Xahau/hooks-cli) | A command-line tool (\`npm i -g @xahau/hooks-cli\`): \`hooks-cli init\` starts a project, \`hooks-cli compile-c\` compiles a folder of C Hooks to \`.wasm\`, \`hooks-cli debug\` follows an account's Hook debug output |
| [Hooks Toolkit](https://hooks-toolkit.com/) | TypeScript and Python SDKs to test and deploy Hooks, and [utilities](https://hooks-toolkit.com/hook-tools) for the formats Hooks work with: XFL, binary, hex and time visualizers, keylet tools, and a local network generator |
| [JSHooks](https://github.com/Xahau/jshooks-alpha) | Hooks written in JavaScript instead of C, still in alpha |

### Rules that keep Hooks safe

- **Parameters over constants**: one audited binary, many deployments.
- **Refuse early, accept late.** Every check that can refuse runs before anything is emitted.
- **Guard every loop** with \`GUARD(n)\`: the VM rejects Hooks with unbounded loops.
- **Your own emitted transactions trigger your Hook** again: always let the account's own transactions through first.
- **An emitted transaction can fail.** Never treat "emitted" as "done": keep what you need in state and settle it in \`cbak\`, where \`meta_slot\` gives the result.
- **\`GUARD(n)\` counts every pass**, including passes through macros that loop, across the whole execution.
- **Never trust \`Amount\` on a payment you didn't send** without checking for \`tfPartialPayment\`.
- **Watch macro arguments**: \`ACCOUNT_COMPARE(x, tok + 20, y)\` doesn't compile, because the macro indexes its arguments; use a pointer variable. (Similar macro pitfalls are why the URIToken course recommends \`-Wall\`.)
- **Removing a Hook**: \`SetHook\` with an empty \`CreateCode\` and \`hsfOverride\` (\`hooks/lib.js\`'s \`remove\`).

### When not to use a Hook

If the ledger has a native control for your rule (approval, freeze, clawback, DepositAuth, escrow), use that. Native controls are audited by the whole network, cost nothing to run, and investors' wallets understand them. Reach for a Hook only for what no flag expresses, and write down, in your terms, exactly what it does and what it can't.

### In the Xahau docs

- [Hooks introduction](https://docs.xahau.network/hooks/concepts/introduction/)
- [SetHook](https://docs.xahau.network/protocol-reference/transactions/transaction-types/sethook/)
- [Compiling Hooks](https://docs.xahau.network/hooks/concepts/compiling-hooks/)
- [Debugging Hooks](https://docs.xahau.network/hooks/concepts/debugging-hooks/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/hooks/build.sh" },
          language: "bash",
          code: example("hooks/build.sh"),
        },
      ],
      slides: [
        {
          title: { en: "Build" },
          content: { en: "clang --target=wasm32 -mcpu=mvp\n→ hook-cleaner → .wasm\n→ SetHook with parameters" },
          visual: "🛠️",
        },
        {
          title: { en: "Native First" },
          content: { en: "A flag exists? Use the flag.\nHooks only for what no flag expresses\n\nDocument what they can't do" },
          visual: "🧱",
        },
      ],
    },
  ],
}

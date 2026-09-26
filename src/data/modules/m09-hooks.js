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
        en: `[Module 4](?m=4&l=1) sold HBOND with a DEX offer. Some investors (and their compliance teams) prefer a plain instruction: "send USD to this address". A Hook on the TREASURY makes that as safe as the DEX: it checks everything **before** the USD moves, and delivers HBOND in the same run.

### What the desk checks

The treasury is the destination of the investor's payment, so its Hook is a **strong** stakeholder: whatever it refuses never happens, and the investor keeps their USD.

1. **The currency** is the configured USD, from the configured issuer. Anything else: refused.
2. **No partial payments.** With \`tfPartialPayment\`, a payment's \`Amount\` is only a maximum and less may arrive; a desk that trusted \`Amount\` would over-deliver. Refused.
3. **The sender can receive HBOND**: it has a trust line to the issuer, **authorised**. The Hook reads that trust line with \`util_keylet(KEYLET_LINE, …)\` and checks the issuer's auth bit (\`lsfLowAuth\` or \`lsfHighAuth\`, depending on which account ID is numerically lower).
4. **The treasury has enough HBOND left.**

Then it **emits** a payment of \`USD ÷ PRICE\` HBOND back to the sender. XAH payments and the treasury's own transactions (including that emitted payment, which triggers the Hook again) pass untouched.

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

Leave CAROL unapproved: this lesson and [Module 8](?m=8&l=2) rely on her being refused.

### Running it

\`\`\`
✔ install subscription_desk: tesSUCCESS
✔ alice pays 1000 USD to the desk: tesSUCCESS  [hook] Desk: subscription accepted, tokens on the way.
  ALICE: 478 -> 488 HBOND
✘ carol pays 1000 USD to the desk: tecHOOK_REJECTED  [hook] Desk: your trust line is not authorised yet (KYC pending).
✘ bob pays 500 USD to the desk: tecHOOK_REJECTED  [hook] Desk: partial payments are refused.
\`\`\`

The emitted payment is a **separate transaction**, validated a ledger or two later; the script polls for the balance change. Two more cases behave as designed: 250 USD buys 2.5 HBOND (issued tokens are divisible, so the desk doesn't need to round), and a plain XAH payment to the treasury passes with "Desk: XAH received, not a subscription."

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
          content: { en: "✔ right USD, right issuer\n✘ partial payments\n✔ sender's HBOND line authorised\n✔ treasury has enough\n→ emit HBOND = USD ÷ PRICE" },
          visual: "🏦",
        },
      ],
    },
    {
      id: "m9l3",
      title: { en: "A Holding Cap: React in the Same Breath" },
      theory: {
        en: `Many securities limit how much one investor may hold (a concentration limit, or a cap that keeps an offering under a legal threshold). Lesson 1 showed the issuer can't **block** a transfer that breaks it. It can **react**: detect it right after, and freeze the receiver.

### How holding_cap works

Installed on the ISSUER with a collect call (\`asfTshCollect\` + \`hsfCollect\`), with \`HookOn\` set to **Payment and OfferCreate**, so it runs weakly after every HBOND payment between holders and every DEX order that touches HBOND:

1. Ignore the issuer's own transactions, other currencies, and payments **to** the issuer (returns).
2. Pick the account that may now hold more: the **receiver** of a payment, or the account that **placed** a DEX order. Read its trust line: a weak Hook runs after the transaction, so the balance already includes it.
3. If it's above \`MAX\`, **emit a \`TrustSet\` with \`tfSetFreeze\`** on that line.

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

The 10-token transfer took ALICE to 503, over the cap of 500, and the Hook froze her: her next attempt to send fails with \`tecPATH_DRY\`. The compliance team then unfroze her (\`22-freeze.js ALICE --off\`, not shown), and she bought 1 more HBOND **on the DEX**: the Hook caught that too and froze her again. As [Module 3](?m=3&l=1) showed, a frozen holder can still return tokens to the issuer, so the fix is in her hands.

### Building a transaction by hand in C

The Hooks headers have a ready-made macro for a payment, not for a \`TrustSet\`, so \`holding_cap.c\` serialises one field by field: type, flags, sequence 0, first/last ledger, \`LimitAmount\` (a zero amount of HBOND whose "issuer" is the holder), fee, an empty signing key, the account, and finally \`EmitDetails\` from \`etxn_details\`.

Size the \`EmitDetails\` buffer with care: \`etxn_details\` **refuses a buffer shorter than 116 bytes** (138 with a callback), even though it writes only 115. A buffer sized to what it writes makes \`emit\` fail with \`EMISSION_FAILURE\` (-11).

### Costs and limits

- A **collect call** means the issuer pays the fee for every weak execution: every HBOND transfer between holders now costs the issuer a little XAH. Keep the Hook small.
- There's a gap between the transfer and the freeze: the emitted \`TrustSet\` lands a ledger or two later, and until then the receiver isn't frozen and could pass the tokens on. The rule is **reactive**, not preventive, and your terms should say so.
- **DEX trades need \`OfferCreate\` in \`HookOn\`.** With \`Payment\` alone, the issuer's Hook never runs on a DEX purchase (\`hook executions: []\`), so a buyer could take 600 tokens with a cap of 500. The Hook must also check the account that **placed** the order, since a DEX trade has no payment receiver. With both:

  \`\`\`
  ✔ A buys 600 on DEX (HookOn Payment+OfferCreate): tesSUCCESS  [hook] Cap: limit exceeded, receiver frozen.
    A: 600, frozen=true
  \`\`\`

  One gap remains, stated in the source: when someone **sells into a resting bid**, the account that gains tokens is the bid's owner, not the account that sent the transaction, and this Hook doesn't check it. Closing that gap means reading the transaction's metadata (\`meta_slot\`).

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
          content: { en: "Issuer Hook, collect call (weak)\nAfter each transfer: receiver > MAX?\n→ emit TrustSet tfSetFreeze\n\nCan't block. Can freeze a ledger later." },
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
| **Release** | An **Invoke** to the vault with \`ID\` = the lock's hash. Anyone may send it, like \`EscrowFinish\` | Once ledger time passes \`AFTER\`, emits the payment to the beneficiary and deletes the lock. Too early: refused |
| **Void** | An Invoke from the **issuer** with \`ID\` and \`OP = VOID\` | Deletes the lock without paying anyone: the step after a clawback |

Any other transaction the vault signs itself is refused, unless the Hook emitted it or it only moves XAH. An **Invoke** is a transaction that does nothing except run the Hooks of its \`Destination\`: the natural way to ask a Hook to act.

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

\`release-lock.js\` reads the lock straight from the Hook's state (\`ledger_entry\` with \`hook_state\`) before asking, so anyone can check a lock's terms without trusting the issuer's word.

### Compared with an escrow

| | Native escrow | Lockbox Hook |
|---|---|---|
| Works for a token with clawback | No (\`tecNO_PERMISSION\`) | Yes |
| Issuer can claw back locked tokens | Not applicable | Yes, from the vault |
| Who enforces the lock | The ledger itself | The Hook, as long as it stays installed |
| Where the tokens sit | In the owner's account, marked locked | In the vault's account |

The last two rows are the price. Whoever holds the vault's key can **remove the Hook** and then move the tokens. For a lock investors can rely on, put the key out of reach once the Hook is installed: a signer list whose signers include an independent party ([Module 8](?m=8&l=1)), and ideally a disabled master key. The course keeps the key so you can re-run and remove the lesson.

### Build it yourself

\`\`\`
sh hooks/build.sh lockbox
\`\`\`

\`hook-cleaner\` keeps only the \`hook\` function and drops any other, so a helper function must be inlined (\`__attribute__((always_inline))\` in \`lockbox.c\`), or the install fails with \`temMALFORMED\`. The bundled headers also lack \`otxn_param\`, the call that reads a transaction's parameters; \`lockbox.c\` declares it.

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
          content: { en: "Lock: pay HBOND to VAULT with BEN + AFTER\nRelease: Invoke with ID, after AFTER\nVoid: issuer only, after a clawback\n\nThe vault's own key can't spend" },
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

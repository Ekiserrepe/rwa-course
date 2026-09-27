import { example } from '../example-code.js'

export default {
  id: "m11",
  icon: "🛡️",
  title: { en: "Production: Mainnet, Law and the Launch Checklist" },
  lessons: [
    {
      id: "m11l1",
      title: { en: "From Testnet to Mainnet" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **Amendment** | A change to the ledger's rules, switched on network-wide by validator vote. |
| **Monitoring** | Watching your accounts' transactions live, and alerting on anything unexpected. |
| **Preflight** | A read-only check of an account's configuration before launch. |

Any other term: see the [Glossary](?m=0&l=9).

The code in this course runs on mainnet unchanged, with one deliberate lock: \`lib/xahau.js\` refuses to connect to any network but testnet unless you set \`ALLOW_MAINNET=1\`. Some scripts set flags that can never be undone (clawback, RequireAuth), and a stray \`NETWORK\` variable must not be enough to set them on a real account. Read-only scripts such as \`90-preflight.js\` connect anywhere. What changes is everything around the code.

### Network

| | Testnet | Mainnet |
|---|---|---|
| WebSocket | \`wss://xahau-test.net\` | \`wss://xahau.network\` |
| NetworkID | 21338 | 21337 |
| XAH | Free from the faucet | Real, bought on the market |

Set \`NETWORK\` in the environment; \`autofill\` sets \`NetworkID\` from the node you're connected to.

### Features: check, don't assume

Every feature this course uses was **enabled on mainnet** when it was written (September 2026, nodes on release 2026.6.21): \`Clawback\`, \`DeepFreeze\`, \`PriceOracle\`, \`PaychanAndEscrowForTokens\`, \`Remarks\`, \`URIToken\`, \`Hooks\`, \`HookCanEmit\`, \`IOUIssuerWeakTSH\`, \`DepositAuth\`, \`DepositPreauth\`. Some are recent, and testnet runs ahead with amendments mainnet doesn't have (at the time of writing, for example \`HookOnV2\` and \`AMMClawback\`). Before launch, ask the mainnet node itself:

\`\`\`json
{ "command": "feature" }
\`\`\`

and check that every amendment your flows depend on is \`"enabled": true\`. \`90-preflight.js\` does exactly that, and counts a missing one as a blocker:

\`\`\`bash
NETWORK=wss://xahau.network node 90-preflight.js rYourIssuer
\`\`\`

### Real costs

- **Issuer and treasury**: 1 XAH base reserve each, plus 0.2 XAH per object they own (signer list, oracle, offers, escrows, hooks).
- **Each investor**: needs XAH for their own account (1 XAH) and their trust lines (0.2 XAH each, HBOND and USD), plus fees. Your onboarding has to tell them, or give it to them.
- **Hooks**: executions raise the fee of the transactions that trigger them, and a collect call ([Module 9](?m=9&l=2)) makes the **issuer** pay for every weak execution.

### Investors sign in their own wallets

In the course, scripts sign for investors with seeds from \`.env\`. In production, investors sign their own \`TrustSet\`, \`OfferCreate\` and \`Payment\` in their wallet, usually **Xaman**: your backend creates a sign request, the investor approves it on their phone, and your backend verifies the result **on the ledger**, never just the wallet's "signed" callback. The companion URIToken course's Xaman module shows the full pattern.

### In the Xahau docs

- [Public nodes](https://docs.xahau.network/features/public-nodes-rpc/)
- [Amendments](https://docs.xahau.network/features/amendments/)
- [Transaction fees](https://docs.xahau.network/features/transaction-signing/transaction-fees/)`,
      },
      slides: [
        {
          title: { en: "Mainnet" },
          content: { en: "wss://xahau.network · NetworkID 21337\nScripts refuse mainnet without ALLOW_MAINNET=1\nPreflight checks every amendment you rely on\nInvestors need XAH and sign in their own wallet" },
          visual: "🚀",
        },
      ],
    },
    {
      id: "m11l2",
      title: { en: "The Legal Side, from a Developer's Seat" },
      theory: {
        en: `This lesson is not legal advice. It lists the questions your lawyers must answer, because each answer changes your code.

### Is it a security?

A token that pays interest and principal, or a share of a company's profits, is almost always a **security** or financial instrument, whatever it's called. That decides:

- **Who may buy it** (professional investors only? residents of which countries?). → Your KYC criteria and whether RequireAuth approval depends on investor category.
- **Whether a prospectus is required**, and its disclosures. → The \`prospectus_sha256\` remark ([Module 2](?m=2&l=4)).
- **Who may operate the market**. Trading a security between investors may need a licensed venue in some jurisdictions. → Whether you let holders use the public DEX, or restrict secondary trading.
- **Whether the ledger may be the legal register** ([Module 1](?m=1&l=1)). → How much freeze and clawback you need.

Regimes differ widely by country and change often. In the EU, for example, the crypto-asset regulation (MiCA, Regulation (EU) 2023/1114) explicitly **excludes** tokens that are financial instruments; those fall under existing securities law (MiFID II, the Prospectus Regulation), and a separate DLT Pilot Regime (Regulation (EU) 2022/858) covers trading and settlement infrastructure built on distributed ledgers. Other jurisdictions draw these lines differently. Ask, don't assume.

### Anti-money-laundering

KYC at onboarding is the start: ongoing monitoring, sanctions screening of holders, and rules on transfers between parties may apply. Freeze and deep freeze ([Module 3](?m=3&l=1)) are how a sanctions hit reaches the ledger; the decision process lives off it.

### Privacy

No personal data on the ledger: not in Remarks, memos, URIs or domain files. The ledger must stay useful even if every investor's identity is known only to you and your KYC provider.

### What your terms should say about the ledger

- The issuer and treasury **addresses**, and that no other address issues the real token.
- The ledger controls the issuer holds (approval, freeze, deep freeze, clawback, Hooks) and **when** it will use them.
- The record-date rule and how payments are made.
- What happens with lost keys, and what the issuer **cannot** recover ([Module 10's incident](?m=10&l=3)).
- Where NAV and attestations are published, and by whom.`,
      },
      slides: [
        {
          title: { en: "Questions for Your Lawyers" },
          content: { en: "Is it a security? Who may buy?\nProspectus? Who may run the market?\nIs the ledger the legal register?\nAML, sanctions, privacy" },
          visual: "⚖️",
        },
        {
          title: { en: "Terms Must Name" },
          content: { en: "Issuer + treasury addresses\nFreeze / clawback: when and how\nRecord date, payments\nLost keys: what can be recovered" },
          visual: "📑",
        },
      ],
    },
    {
      id: "m11l3",
      title: { en: "Operating It: Keys, Monitoring, Incidents" },
      theory: {
        en: `A tokenized asset runs for years. Most of what goes wrong is operational.

### Keys

- Issuer: signer list with separate people and devices (hardware wallets or an HSM), master key disabled after testing ([Module 8](?m=8&l=3)).
- Treasury: its own key or list, rotatable, holding only what operations need.
- **No seed ever in a server's environment, a repository or a chat.** The course's \`.env\` is for testnet.

### Monitoring

Subscribe to your own accounts and alert on anything you didn't plan:

\`\`\`json
{ "command": "subscribe", "accounts": ["<ISSUER>", "<TREASURY>"] }
\`\`\`

Every validated transaction touching them arrives as a message. Alert when:

- the issuer signs **anything** you didn't schedule (above all: a Payment that creates supply, a Clawback, a flag change);
- \`gateway_balances\` obligations change without a matching sale or redemption;
- a trust line is frozen or unfrozen;
- the NAV oracle hasn't been updated within its window ([Module 7](?m=7&l=1));
- a Hook starts rejecting more than usual.

### Incident runbooks

Write them before launch, rehearse them on testnet, and keep them next to the signer list:

| Incident | First move |
|---|---|
| Treasury key leaked | Freeze the treasury's line; move funds; rotate |
| Unexpected supply increase | Global freeze; investigate the issuer's signers |
| Investor lost keys | Evidence, then freeze → clawback → KYC → re-issue ([Module 10](?m=10&l=3)) |
| Sanctions hit on a holder | Deep freeze; follow the legal process |
| Stablecoin issuer freezes the treasury's USD | Out of your hands: disclose, use another settlement asset |

### Keep verifying

The course's \`npm run verify\` reruns every script against testnet and checks each result. Keep a version of it for **your** flows and run it against testnet on a schedule: the network, the libraries and the amendments change, and you want to find out from your test, not from an investor.`,
      },
      slides: [
        {
          title: { en: "Operate" },
          content: { en: "Keys: multisig, hardware, no seeds on servers\nMonitor: subscribe to your accounts\nAlert on unplanned issuer activity\nRunbooks, rehearsed on testnet" },
          visual: "📟",
        },
      ],
    },
    {
      id: "m11l4",
      title: { en: "The Launch Checklist" },
      theory: {
        en: `\`90-preflight.js\` reads an issuer account and reports what's ready, as **MUST** (don't launch without it), **SHOULD** (decide consciously) and **INFO**. Against the course's ISSUER after [Module 8](?m=8&l=0):

\`\`\`
Preflight for rGqGCX7AAGiCosU5oV1t9oKusS5NDFUKgt on wss://xahau-test.net (NetworkID 21338)

  ✔ MUST   RequireAuth: only approved accounts can hold the token
  ✔ MUST   DefaultRipple: holders can transfer to each other
  ✔ MUST   NoFreeze is off: you can still freeze in an emergency
  ✔ SHOULD Clawback enabled (note: it rules out token escrows)
  ✔ SHOULD Domain set: harbor-bond.example
  ✔ MUST   Multisig: 2 of 3
  ! SHOULD Master key disabled (only after the signer list is tested)
  ✔ MUST   Not globally frozen
  ✔ SHOULD Transfer fee: none
  ✔ SHOULD Legal name on-ledger: Harbor Bond SPV Ltd.
  ✔ SHOULD Prospectus digest on-ledger
  ✔ INFO   Hooks installed: 0
  ✔ MUST   Amendment Clawback enabled
  ✔ MUST   Amendment DeepFreeze enabled
  ✔ MUST   Amendment DepositAuth enabled
  ✔ MUST   Amendment DepositPreauth enabled
  ✔ MUST   Amendment PriceOracle enabled
  ✔ MUST   Amendment PaychanAndEscrowForTokens enabled
  ✔ MUST   Amendment Remarks enabled
  ✔ MUST   Amendment URIToken enabled
  ✔ MUST   Amendment Hooks enabled
  ✔ MUST   Amendment HookCanEmit enabled
  ✔ MUST   Amendment IOUIssuerWeakTSH enabled

No blockers.
\`\`\`

Against the capstone's issuer, which never got a signer list, it says \`✘ MUST Multisig: no signer list\` and exits with code 2. Run it in your deployment pipeline.

### The whole checklist

**Legal**
- ☐ Terms name the issuer and treasury addresses and describe every ledger control (lesson 2)
- ☐ Prospectus final; its SHA-256 written as an immutable remark

**Issuer account** (before the first trust line!)
- ☐ RequireAuth on; clawback **17** on, or consciously off (then token escrow is available)
- ☐ DefaultRipple on; NoFreeze **off**
- ☐ Domain set, and the domain names the address back
- ☐ Fact-sheet Remarks: legal name, terms, prospectus digest, status
- ☐ Signer list installed, **tested with a real action**, master key disabled

**Operations**
- ☐ Treasury separate from the issuer, with its own keys
- ☐ Settlement stablecoin chosen: issuer, controls and risks disclosed
- ☐ KYC flow → issuer approval tested end to end
- ☐ Coupon run tested with \`--dry-run\` and a rerun that pays nobody twice
- ☐ Redemption window checks funding before opening
- ☐ NAV publisher's address published; readers refuse stale prices
- ☐ Any Hook: parameters documented, what it can't do documented, removal tested

**Mainnet**
- ☐ Every amendment you rely on enabled (\`feature\`)
- ☐ Monitoring and alerts live before the first investor
- ☐ Incident runbooks rehearsed on testnet
- ☐ \`90-preflight.js\` against the mainnet issuer: no blockers

### Where to go next

- The [Xahau documentation](https://docs.xahau.network/) for every transaction and object used here.
- The courses listed on [xahau.network/learn](https://xahau.network/learn/): **Learn URITokens** for unique assets in depth, IPFS, and signing with Xaman, and **Learn Xahau** for the Xahau Network in general.

You've issued, controlled, sold, serviced, valued, governed and retired a tokenized asset. Everything else is the same steps, with real money and real signatures.`,
      },
      codeBlocks: [
        {
          title: { en: "examples/90-preflight.js" },
          language: "javascript",
          code: example("90-preflight.js"),
        },
      ],
      slides: [
        {
          title: { en: "Preflight" },
          content: { en: "MUST: RequireAuth · DefaultRipple\nNoFreeze off · multisig · not frozen\nSHOULD: clawback · domain · master off\nfact sheet · prospectus digest" },
          visual: "✅",
        },
        {
          title: { en: "You Did It" },
          content: { en: "Issue · Control · Sell\nService · Value · Govern · Retire\n\nNow with real signatures" },
          visual: "🎓",
        },
      ],
    },
  ],
}

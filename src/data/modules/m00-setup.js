import { example } from '../example-code.js'

export default {
  id: "m0",
  icon: "🧰",
  title: { en: "Start Here: Xahau Basics and Setup" },
  lessons: [
    {
      id: "m0l1",
      title: { en: "What You Will Build" },
      theory: {
        en: `This course teaches **tokenization of real-world assets (RWA)** on the Xahau Network by doing it. You will not just read about "putting a bond on the blockchain": you will issue a regulated token, decide who may hold it, freeze and claw it back, sell it for a stablecoin, pay its coupons, publish its value, represent the building behind it as a unique token, govern it with several keys and enforce extra rules with Hooks, all on Xahau testnet.

### The running example: Harbor Bond 2030

Most lessons feed a single project, a fictional bond called **Harbor Bond 2030**:

- A company, **Harbor Bond SPV Ltd.**, owns a warehouse and borrows against it.
- It issues **HBOND**, a token worth **100 USD face value**, paying a **5% fixed coupon**, maturing on **2030-06-30**.
- Only investors who passed identity checks (**KYC**) can hold it.
- Investors pay in a **USD stablecoin**, receive coupons in it, and get their principal back in it at maturity.
- The warehouse's title deed is a **URIToken**: a unique token that points to the legal document and carries its fingerprint.

By the end you will have run that bond's whole life, from the issuer's first setting to the last token being retired.

### What you need to know already

Only how to run a script from a terminal and read a little JavaScript. **No blockchain or finance knowledge is assumed.** The next lessons explain blockchains, accounts, keys, transactions and ledger objects in plain words, and Module 1 explains what "real-world asset" and "tokenization" actually mean. If you already know Xahau or the XRP Ledger, skim this module and jump to lesson 7.

Every module starts with the **new words** it introduces, and the [Glossary](?m=0&l=9) at the end of this module defines every term in the course. Each lesson ends with links to the matching pages of the official [Xahau documentation](https://docs.xahau.network/).

This course belongs to a family: for general Xahau see [Learn Xahau](https://learnxahau.inftf.org); for NFTs see [Learn URITokens](https://github.com/Ekiserrepe/uritoken-course).

### How the course is organised

| Module | Topic |
|---|---|
| 0 | Start here: blockchain basics, accounts, transactions, setup, glossary |
| 1 | RWA fundamentals: what is tokenized, what the ledger can and cannot do |
| 2 | Issuing a fungible token: issuer settings, currency codes, supply |
| 3 | Compliance controls: KYC, freeze, deep freeze, clawback, deposit rules |
| 4 | Markets: stablecoin settlement, primary sale, the DEX |
| 5 | Asset servicing: coupons, reserves in escrow, redemption at maturity |
| 6 | Unique assets: deeds and documents as URITokens |
| 7 | Oracles: publishing and reading NAV on the ledger |
| 8 | Keys and governance: multisig, key rotation |
| 9 | Hooks for compliance: a subscription desk and a holding cap |
| 10 | Capstone: the whole bond, from term sheet to maturity |
| 11 | Production: mainnet, legal wrapper, launch checklist |

### Every script is real

The code in this course comes from the \`examples/\` folder of the course repository, and the lessons show those files verbatim. Every script was run against Xahau testnet while the course was written, and a script (\`npm run verify\`) runs all of them again and checks each result. Where the ledger surprised us, for example when a flag we set turned out to mean something else on Xahau, the lesson says so.

### Not legal advice

Tokenizing a real asset is mostly law, and only partly code. This course teaches the ledger side precisely and points out where the legal side decides. It is not legal, tax or investment advice.`,
      },
      slides: [
        {
          title: { en: "Learn RWA" },
          content: { en: "Tokenize real-world assets on Xahau\n\n• Issue · Control · Sell\n• Pay · Value · Govern\n• Run a bond to maturity" },
          visual: "🏗️",
        },
        {
          title: { en: "Harbor Bond 2030" },
          content: { en: "HBOND: 100 USD face, 5% coupon\nKYC-only holders\nSettled in a USD stablecoin\nBacked by a warehouse deed (URIToken)" },
          visual: "⚓",
        },
      ],
    },
    {
      id: "m0l4",
      title: { en: "Blockchain and Xahau in Plain Words" },
      theory: {
        en: `Before any code, the ideas everything else rests on.

### A ledger is a record book

A **ledger** is a book of records: who owns what, and every change to it. Your bank keeps one, a share registry keeps one, a land registry keeps one. Each is private, and you trust its keeper to keep it honest.

### A blockchain is a record book nobody owns

A **blockchain** keeps the same record book on many independent computers around the world, called **nodes**. None of them is in charge. When someone wants to change something (send money, transfer a token), the request goes to all of them, and they **agree together** on which changes are valid and in what order. Only then is the change written down, and from that moment it cannot be edited or deleted.

That gives you three properties no single registry can promise:

- **Nobody can quietly change history.** Every node would notice.
- **Nobody can switch it off.** There is no central server to unplug.
- **Anyone can check it.** The whole record book is public.

For real-world assets, the third one matters most: an investor, an auditor or a regulator can verify the supply, the holders and every transfer themselves, without asking the issuer.

### How Xahau agrees: ledgers every few seconds

On Xahau, the nodes that vote are called **validators**. Every few seconds they agree on a new batch of changes and seal it as a numbered **ledger version**: ledger 12,506,427, then 12,506,428, and so on. A change that made it into a sealed ledger is **validated**: final, for good. (The process is called **consensus**. There is no mining: validators simply vote.)

**Finality** is a big deal for finance. On some blockchains a payment is only "probably final" and can be undone by a reorganisation minutes later. On Xahau, validated means settled.

### Xahau itself

**Xahau** is a public blockchain from the same family as the XRP Ledger. It keeps the XRP Ledger's built-in features for issued tokens (trust lines, freezes, the exchange) and adds its own, including **URITokens** (unique tokens), **Remarks** (notes on ledger objects) and **Hooks** (small programs attached to accounts).

- Its own currency is **XAH**. Every change costs a tiny fee, paid in XAH.
- The smallest unit of XAH is the **drop**: 1 XAH = 1,000,000 drops.
- There are two separate networks. **Mainnet** is the real one, where XAH has value. **Testnet** is a copy for practice, with free XAH from a **faucet**. Everything in this course runs on testnet.

### What "public" really means

Everything on the ledger is visible to everyone, forever: balances, holders, transfers. Your name is not on it, only your **address** (next lesson). For an RWA that means: identity documents, KYC results and anything personal stay **off** the ledger. The ledger records that an account was approved, never why.

### In the Xahau docs

- [Xahau documentation home](https://docs.xahau.network/)
- [What is different from the XRP Ledger](https://docs.xahau.network/what-is-different/)
- [Faucet and explorers](https://docs.xahau.network/features/faucet-and-explorer/)`,
      },
      slides: [
        {
          title: { en: "A Record Book Nobody Owns" },
          content: { en: "Same ledger on many computers\nThey agree on every change\nOnce written: final, public, permanent\n\nAnyone can audit it" },
          visual: "📒",
        },
        {
          title: { en: "Xahau" },
          content: { en: "New ledger every few seconds, final\nCurrency: XAH (1 XAH = 1,000,000 drops)\nMainnet = real · Testnet = practice\n\nTokens, URITokens, Remarks, Hooks" },
          visual: "🌐",
        },
      ],
    },
    {
      id: "m0l5",
      title: { en: "Accounts, Wallets and Keys" },
      theory: {
        en: `To own anything on Xahau you need an **account**. To control it you need **keys**. The app that keeps your keys is a **wallet**. These three words get mixed up all the time, so let's separate them.

### The key pair: the real "owner"

Everything starts with a secret, created by a random-number generator:

| Piece | Looks like | Share it? |
|---|---|---|
| **Seed** (secret) | \`sEd7NT88mNFBNqiaBnTabuZm697JPeB\` | **Never.** Whoever has it controls the account |
| **Public key** | \`ED8891AA63C9…\` | Yes, it proves your signatures |
| **Address** | \`rJm4Q5eNrzb2DVdaYAX7uCbATxFkLTrKRf\` | Yes, it's your account number |

The public key and the address are **calculated from the seed**, so the seed is all you need to back up. Addresses always start with **r**. Creating a key pair happens entirely on your computer, with no network and no permission.

### The account: what the ledger knows about you

A key pair alone is not an account yet. The account appears on the ledger the first time someone sends it enough XAH to cover the **base reserve** (currently 1 XAH). From then on the ledger stores an entry for the address called **AccountRoot**: its balance, its settings, and its **sequence number** (a counter of how many transactions it has sent).

### The wallet: an app that holds keys

A **wallet** is software that stores your seed and uses it to **sign** transactions. On Xahau the most used is **Xaman**, a phone app. In this course's scripts, the "wallet" is simply a seed loaded from a file called \`.env\`: fine for testnet practice, never for an issuer's real keys (Module 8 and 11).

### Signing: how the network knows it was you

When you want to change something, your wallet uses the seed to produce a **signature**: a proof, mathematically tied to your keys and to the exact content of the request. Any node can check it with your public key. Nobody can forge it without the seed, and changing even one character of the request breaks it.

For an issuer this is the whole security model: **whoever holds the issuer's key can create unlimited tokens**. That's why Module 8 spreads that power over several people.

### In the Xahau docs

- [Account management](https://docs.xahau.network/features/network-features/account-managment/)
- [The AccountRoot object](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/accountroot/)
- [Base58 addresses](https://docs.xahau.network/protocol-reference/data-types/base-58-encodings/)`,
      },
      slides: [
        {
          title: { en: "Three Words" },
          content: { en: "Keys: seed → public key → address\nAccount: the address's entry on the ledger\nWallet: the app that holds the seed\n\nNever share the seed" },
          visual: "🔑",
        },
        {
          title: { en: "An Account Is Born" },
          content: { en: "Keys: made offline, instantly\nAccount: when it first receives ≥ 1 XAH\n(the base reserve)" },
          visual: "🐣",
        },
      ],
    },
    {
      id: "m0l6",
      title: { en: "Transactions: How Anything Changes" },
      theory: {
        en: `The ledger only ever changes one way: through a **transaction**, a signed instruction from an account. Sending XAH is a transaction. So is issuing a token, approving an investor, freezing a holder or paying a coupon.

### A transaction is a small JSON document

Here is a complete **Payment** (sending 1 XAH), exactly as it goes to the network:

\`\`\`json
{
  "TransactionType": "Payment",
  "Account": "rHurvZGUnhquLjCHNAAwQTV3ksrPoQW2U8",
  "Destination": "rDjqmYCaD6kh4dZxixbPCVuY3Kbi7EEcZd",
  "Amount": "1000000",
  "Fee": "10",
  "Sequence": 843283772,
  "LastLedgerSequence": 12506445,
  "NetworkID": 21338
}
\`\`\`

| Field | Meaning in plain words |
|---|---|
| \`TransactionType\` | What kind of change. Each type has its own fields |
| \`Account\` | Who is sending it (and signing it) |
| \`Destination\`, \`Amount\` | Fields specific to a Payment: to whom, how much (in drops) |
| \`Fee\` | The cost, in drops. It is destroyed, not paid to anyone |
| \`Sequence\` | The account's counter: each transaction uses the next number, so none can be replayed |
| \`LastLedgerSequence\` | "Give up if not included by this ledger": a deadline |
| \`NetworkID\` | Which network: 21337 mainnet, 21338 testnet |

You normally write only the first four. The library's \`autofill\` adds the rest.

### Transaction types used in this course

| Type | Does | Module |
|---|---|---|
| \`AccountSet\` | Changes an account's settings (flags, domain) | 2, 3 |
| \`TrustSet\` | Opens a trust line, or (for the issuer) approves or freezes one | 2, 3 |
| \`Payment\` | Sends XAH or a token. Also how tokens are created and destroyed | 2–5 |
| \`Clawback\` | The issuer takes its token back from a holder | 3 |
| \`DepositPreauth\` | Pre-approves a sender for an account that requires it | 3 |
| \`OfferCreate\` · \`OfferCancel\` | Places · removes an order on the exchange | 4, 5 |
| \`EscrowCreate\` · \`EscrowFinish\` | Locks funds until a time · releases them | 5 |
| \`URITokenMint\` · \`URITokenCreateSellOffer\` · \`URITokenBuy\` | Creates · lists · buys a unique token | 6 |
| \`SetRemarks\` | Writes small notes on a ledger object | 2, 6 |
| \`OracleSet\` | Publishes a price on the ledger | 7 |
| \`SignerListSet\` | Lets several keys sign together for an account | 8 |
| \`SetHook\` | Installs a program on an account | 9 |

### The life of a transaction

1. **Write** it (the JSON above).
2. **Sign** it with the account's seed. The result is a blob of bytes plus a **hash**: the transaction's unique ID, which you can look up forever.
3. **Submit** it to a node, which shares it with the network.
4. **Validation**: within a few seconds a ledger includes it, and it is final.

### Result codes: did it work?

Every transaction ends with a code. The first letters tell you the category:

| Prefix | Meaning | Fee charged? |
|---|---|---|
| \`tes\` | **Success** (\`tesSUCCESS\`) | Yes |
| \`tec\` | **Failed but recorded**: it reached a ledger, did nothing | Yes |
| \`tem\` | **Malformed**: rejected, the request itself is wrong | No |
| \`tef\` / \`ter\` / \`tel\` | Rejected or retried before reaching a ledger | No |

This course shows many \`tec\` codes on purpose, such as \`tecNO_AUTH\` when someone without KYC tries to buy, because a compliance rule you have never seen fire is a rule you can't trust.

### In the Xahau docs

- [All transaction types](https://docs.xahau.network/protocol-reference/transactions/transaction-types/)
- [Fields every transaction has](https://docs.xahau.network/protocol-reference/transactions/transaction-common-fields/)
- [Result codes](https://docs.xahau.network/protocol-reference/transactions/transaction-results/)
- [Transaction fees](https://docs.xahau.network/features/transaction-signing/transaction-fees/)`,
      },
      slides: [
        {
          title: { en: "Transaction" },
          content: { en: "A signed instruction: the only way\nthe ledger ever changes\n\nWrite → sign → submit → validated" },
          visual: "✉️",
        },
        {
          title: { en: "Did It Work?" },
          content: { en: "tes → success\ntec → recorded, did nothing, fee paid\ntem/tef/ter → rejected, no fee\n\nSee every rule fire at least once" },
          visual: "🚦",
        },
      ],
    },
    {
      id: "m0l7",
      title: { en: "Ledger Objects, Reserves and Reading Data" },
      theory: {
        en: `A ledger version is not a list of transactions. It is a **snapshot of everything that exists** at that moment, stored as **ledger objects**. Transactions create, change and delete them.

### Ledger objects

Each object is one "thing" on the ledger, with a type, some fields and a unique 64-character **ID**. The ones this course uses:

| Object type | What it is | Created by |
|---|---|---|
| \`AccountRoot\` | An account: balance, sequence, settings | Receiving the first XAH |
| \`RippleState\` | A **trust line**: permission to hold a token, the balance, and its approval and freeze flags | \`TrustSet\` |
| \`Offer\` | An order waiting on the exchange | \`OfferCreate\` |
| \`Escrow\` | Funds locked until a condition | \`EscrowCreate\` |
| \`URIToken\` | A unique token (a deed, a certificate) | \`URITokenMint\` |
| \`Oracle\` | A published price | \`OracleSet\` |
| \`SignerList\` | Who may sign together for an account | \`SignerListSet\` |
| \`Hook\` / \`HookState\` | A program on an account / the data it stores | \`SetHook\` / the Hook |

So when this course says "the investor's HBOND balance", it means a field of one specific \`RippleState\` object: not a row in the issuer's database, but an entry in the global record book that anyone can read.

### Reserves: space on the ledger isn't free

Every node stores every object. To stop anyone filling the ledger with junk, each account must keep some XAH **locked**:

- **Base reserve**: 1 XAH, just for the account to exist.
- **Owner reserve**: 0.2 XAH **per object** the account owns (each trust line, open order, escrow…).

Locked XAH is still yours: delete the object and it unlocks. The count is the account's \`OwnerCount\`. Values as of writing; read them from \`server_info\`. Note who pays: an investor's trust line is **owned by the investor**, so each holder pays for their own line, not the issuer.

### Reading is free

Only transactions change the ledger and cost a fee. **Reading costs nothing**: you send a **request** to any node over a **WebSocket**, a connection that stays open. The ones you'll use most:

| Request | Answers |
|---|---|
| \`server_info\` | Which ledger we're on, current fee and reserves |
| \`account_info\` | An account's AccountRoot, plus its flags in plain words |
| \`account_lines\` | An account's trust lines: balances, approvals, freezes |
| \`gateway_balances\` | From an issuer's side: total supply in circulation |
| \`account_objects\` | Every object an account owns (filter with \`type\`) |
| \`ledger_entry\` | One object, by its ID |
| \`book_offers\` | The order book for a currency pair |
| \`tx\` · \`account_tx\` | One transaction, by hash · an account's history |

Answers are in JSON. Long lists come in **pages**: when the answer contains a \`marker\`, ask again with it to get the next page.

### In the Xahau docs

- [Ledger object types](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/)
- [How object IDs are calculated](https://docs.xahau.network/protocol-reference/ledger-data/ledger-object-ids/)
- [All request methods](https://docs.xahau.network/features/http-websocket-apis/public-api-methods/)
- [Public nodes to connect to](https://docs.xahau.network/features/public-nodes-rpc/)`,
      },
      slides: [
        {
          title: { en: "Ledger Objects" },
          content: { en: "The ledger = everything that exists now\nAccountRoot · RippleState · Offer\nEscrow · URIToken · Oracle · Hook\n\nEach has a unique ID" },
          visual: "🧱",
        },
        {
          title: { en: "Reserves" },
          content: { en: "1 XAH to exist\n+ 0.2 XAH per object owned\n\nHolders pay for their own trust lines" },
          visual: "🔒",
        },
        {
          title: { en: "Reading Is Free" },
          content: { en: "account_info · account_lines\ngateway_balances · book_offers\nledger_entry · account_tx\n\nOnly transactions cost a fee" },
          visual: "🔎",
        },
      ],
    },
    {
      id: "m0l8",
      title: { en: "Tokens, Trust Lines, the Exchange and Hooks in One Page" },
      theory: {
        en: `The rest of the course builds on a few more ideas. Here they are in short, so no module surprises you.

### XAH and issued tokens (IOUs)

**XAH** is built into the ledger: it has no issuer and needs no permission to hold. Anything else is an **issued token**, also called an **IOU** ("I owe you"): a currency created by an account, its **issuer**. The name is honest: an issued token is a **claim on its issuer**. A USD stablecoin is a claim to a dollar held by the stablecoin company; HBOND is a claim on Harbor Bond SPV. That is exactly what a financial asset is, which is why issued tokens are the natural home for fungible RWAs.

A token amount is an object: \`{ "currency": "USD", "issuer": "r…", "value": "15" }\`. "USD" from two different issuers are two different currencies.

### Trust lines

To hold someone's token you must first say "I accept this token from this issuer, up to this amount". That agreement is a **trust line** (the \`RippleState\` object), created with \`TrustSet\`. It protects you from receiving tokens you never wanted, and it is also where the issuer's controls live: approval (KYC), freeze and clawback all act on trust lines (Module 3).

### Unique tokens: URITokens

A **fungible** token is interchangeable: one HBOND is as good as another. A **non-fungible** token is unique: this deed, this invoice, this certificate. On Xahau, unique tokens are **URITokens**: ledger objects that point to their content with a **URI** and can carry a fingerprint of it (Module 6).

### The exchange (DEX)

Xahau has a **decentralised exchange (DEX)** built into the ledger: anyone can place an **order** ("I sell 10 HBOND for 1,000 USD") with \`OfferCreate\`, and matching orders trade automatically, in one transaction, with no company in the middle (Module 4).

### Hooks: programs on accounts

A **Hook** is a small program installed on an account. It runs when a transaction involves that account, and it can **accept** it, **reject** it, remember data, or send new transactions. Module 9 writes two for an RWA issuer, and shows precisely where their power ends.

### Remarks: notes on objects

**Remarks** are small labelled notes (up to 32 per object, 256 bytes each) written on a ledger object with \`SetRemarks\`. An issuer can publish its legal name and the fingerprint of its prospectus on its own account; a deed token can carry its parcel number.

### In the Xahau docs

- [XAH and token amounts](https://docs.xahau.network/protocol-reference/data-types/currency-formats/)
- [TrustSet (trust lines)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/trustset/)
- [URITokens](https://docs.xahau.network/features/network-features/uritoken/)
- [Offers and the DEX](https://docs.xahau.network/features/network-features/offer/)
- [Hooks introduction](https://docs.xahau.network/hooks/concepts/introduction/)
- [SetRemarks](https://docs.xahau.network/protocol-reference/transactions/transaction-types/setremarks/)`,
      },
      slides: [
        {
          title: { en: "The Building Blocks" },
          content: { en: "IOU = a claim on its issuer\nTrust line = consent to hold it\nURIToken = one unique asset\nDEX = built-in exchange\nHook = program on an account\nRemarks = notes on objects" },
          visual: "🧩",
        },
      ],
    },
    {
      id: "m0l2",
      title: { en: "Project Setup and Testnet Accounts" },
      theory: {
        en: `You need **Node.js 18 or newer** and a terminal. Clone the course repository and work inside \`examples/\`.

### Installing

The examples use two packages:

- **xahau**: the JavaScript library for Xahau. It knows every Xahau transaction type, including \`Clawback\`, \`OracleSet\`, \`SetRemarks\` and \`SetHook\`.
- **dotenv**: loads seeds from a \`.env\` file so they never appear in code.

### Six accounts, six roles

A tokenized asset is never one account. The scripts use six testnet accounts, each with a job you would also find in a real issuance:

| Role | Plays | Used for |
|---|---|---|
| **ISSUER** | Harbor Bond SPV Ltd. | Creates HBOND, approves holders, freezes, claws back. Never trades |
| **TREASURY** | The issuer's operating account | Holds unsold supply, sells it, pays coupons and principal |
| **ALICE** | An investor | Passes KYC, buys, receives coupons |
| **BOB** | Another investor | Passes KYC, trades with Alice |
| **CAROL** | A would-be investor | Never passes KYC: shows every door that stays closed |
| **STABLE** | A stablecoin company | Issues the USD that everyone settles in |

\`01-create-accounts.js\` asks the testnet faucet for six funded accounts (1,000 XAH each) and writes their seeds to \`.env\`. The faucet **rate-limits to about one account per minute**, so the script waits and retries on its own. Expect it to take five or six minutes.

### Security, even on testnet

- \`.env\` is in \`.gitignore\`. Keep it that way.
- Testnet seeds are worthless. An issuer's mainnet key can create unlimited claims on a real company: it never lives in a file (Module 8 and 11).

### Explorers

To look at what your scripts did, paste an address or a transaction hash into:

- [test.xahauexplorer.com](https://test.xahauexplorer.com)
- [xahau-testnet.xrplwin.com](https://xahau-testnet.xrplwin.com)

### In the Xahau docs

- [Faucet and explorers](https://docs.xahau.network/features/faucet-and-explorer/)
- [Client libraries](https://docs.xahau.network/features/developer-tooling/client-libraries/)`,
      },
      codeBlocks: [
        {
          title: { en: "Install" },
          language: "bash",
          code: `git clone https://github.com/Ekiserrepe/rwa-course.git
cd rwa-course/examples
npm install          # xahau + dotenv
node 01-create-accounts.js`,
        },
        {
          title: { en: "examples/01-create-accounts.js" },
          language: "javascript",
          code: example("01-create-accounts.js"),
        },
      ],
      slides: [
        {
          title: { en: "Six Accounts" },
          content: { en: "ISSUER → creates and controls HBOND\nTREASURY → sells and pays out\nALICE, BOB → approved investors\nCAROL → never approved\nSTABLE → issues USD" },
          visual: "👥",
        },
      ],
    },
    {
      id: "m0l10",
      title: { en: "See It for Real: Three First Scripts" },
      theory: {
        en: `With the project set up, three short scripts turn the last lessons into things you can watch happen. Run them from the \`examples/\` folder.

### 1. An account from nothing: 00-wallet-basics.js

It creates a key pair **offline**, asks the faucet to fund it (which creates the account on the ledger), then reads the account back:

\`\`\`
Address (share it freely): rLW2rUKGPE9wXTu9Xte1bny6AiGZ9ed4b5
Seed (NEVER share it):      sEdTKDysdQa…   <- whoever has this controls the account
Balance:     1000 XAH (1000000000 drops)
Objects:     0 (each locks 0.2 XAH)
Locked:      1 XAH = 1 base reserve + objects
Spendable:   999 XAH
\`\`\`

Notice that 1 XAH of the 1,000 can't be spent: that's the **base reserve**.

### 2. A transaction, step by step: 00-anatomy-of-a-transaction.js

ALICE sends 1 XAH to the TREASURY, and the script shows each stage: the four fields you write, the fields \`autofill\` adds (\`Fee: '10'\`, \`Sequence\`, \`LastLedgerSequence\`, \`NetworkID: 21338\`), the signature's **hash** and **blob** (194 bytes here), the result and the ledger it landed in, and finally a lookup of the same transaction by its hash:

\`\`\`
4. Result: tesSUCCESS in ledger 12506427
5. Looked up again by hash: validated = true
\`\`\`

### 3. Look around without spending: 00-look-around.js

Only **requests**, so it's free. It prints the current ledger, fee and reserves, then an account's balance and the objects it owns, grouped by type:

\`\`\`
Network wss://xahau-test.net (NetworkID 21338)
  last validated ledger 12506427, closed 2s ago
  base fee 0.00001 XAH, reserves 1 + 0.2 XAH per object
\`\`\`

Run it again with an address at the end of each module and watch the ISSUER's objects appear: remarks, an oracle, a signer list.

### In the Xahau docs

- [account_info, account_objects, tx and the other requests](https://docs.xahau.network/features/http-websocket-apis/public-api-methods/)
- [Client libraries (xahau.js and others)](https://docs.xahau.network/features/developer-tooling/client-libraries/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/00-wallet-basics.js" },
          language: "javascript",
          code: example("00-wallet-basics.js"),
        },
        {
          title: { en: "examples/00-anatomy-of-a-transaction.js" },
          language: "javascript",
          code: example("00-anatomy-of-a-transaction.js"),
        },
        {
          title: { en: "examples/00-look-around.js" },
          language: "javascript",
          code: example("00-look-around.js"),
        },
      ],
      slides: [
        {
          title: { en: "Watch It Happen" },
          content: { en: "00-wallet-basics → keys, faucet, reserve\n00-anatomy → write, autofill, sign, submit\n00-look-around → free reads, objects" },
          visual: "👀",
        },
      ],
    },
    {
      id: "m0l3",
      title: { en: "The Shared Helper: lib/xahau.js" },
      theory: {
        en: `Every script needs the same things: connect, load a wallet, write amounts of the two currencies, submit a transaction and see whether it worked. That lives in one small file, \`lib/xahau.js\`, so each lesson's script can focus on the idea it teaches.

### What each helper does

- **toHex / fromHex**: domains, Remarks and long currency codes travel as uppercase hex.
- **currencyCode / currencyName**: turn a token name into the ledger's currency field and back (Module 2 explains why \`HBOND\` becomes 40 hex characters).
- **wallet(envName)**: loads a seed from \`.env\`, e.g. \`wallet("ISSUER_SEED")\`.
- **bond(value) / usd(value)**: the course's two currencies as amount objects. \`bond(10)\` is \`{ currency: "48424F4E44…", issuer: <ISSUER>, value: "10" }\`.
- **submit(client, signer, tx, label)**: autofills (Fee, Sequence, NetworkID, LastLedgerSequence), signs, submits and **waits for validation**. It prints ✔ or ✘ with the result code, plus any Hook messages.
- **trustLine(client, account, issuer, currency)**: one trust line as \`account\` sees it, or \`null\`.
- **getObject(client, id)**: reads any ledger object by ID, or \`null\` if it does not exist.

### Why submit() does not throw on tec codes

A \`tec\` result (like \`tecNO_AUTH\`) means the transaction **was included in a ledger and charged a fee**, but did not do what you asked. Many lessons provoke those on purpose to show a control working, so the helper reports the code and lets the script decide.

A \`tem\` or \`tef\` result means the transaction was **rejected before reaching a ledger**. \`submitAndWait\` throws in that case.

### A note on fees

On Xahau the base fee is small (10 drops on testnet at the time of writing), but some transactions cost more: SetRemarks adds 1 drop per byte, and transactions that trigger Hooks pay for the Hook's execution. \`client.autofill\` calculates all of that. Do not hardcode \`Fee\`.

### In the Xahau docs

- [Result codes](https://docs.xahau.network/protocol-reference/transactions/transaction-results/)
- [Transaction fees](https://docs.xahau.network/features/transaction-signing/transaction-fees/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/lib/xahau.js" },
          language: "javascript",
          code: example("lib/xahau.js"),
        },
      ],
      slides: [
        {
          title: { en: "Result Codes" },
          content: { en: "tesSUCCESS → done\ntec… → in a ledger, fee charged, no effect\ntem… / tef… → rejected, never applied\n\nautofill() computes the right Fee" },
          visual: "🚦",
        },
      ],
    },
    {
      id: "m0l9",
      title: { en: "Glossary" },
      theory: {
        en: `Every term the course uses, in plain words. Come back here whenever a word stops you. The "Module" column says where it matters most.

### A to D

| Term | Meaning | Module |
|---|---|---|
| **Account** | An entry on the ledger, identified by an address, holding XAH and objects. [Docs](https://docs.xahau.network/features/network-features/account-managment/) | 0 |
| **AccountRoot** | The ledger object that **is** an account: balance, sequence, settings. [Docs](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/accountroot/) | 0, 2 |
| **AccountSet flag (asf…)** | A number that switches an account setting on or off, e.g. \`asfRequireAuth\` = 2 | 2, 3 |
| **Address** | An account's public identifier, starting with \`r\`. Safe to share | 0 |
| **Amount** | How much: a string of drops for XAH, or \`{ currency, issuer, value }\` for a token. [Docs](https://docs.xahau.network/protocol-reference/data-types/currency-formats/) | 0, 2 |
| **Authorised trust line** | A trust line the issuer approved; with RequireAuth, the only kind that can hold the token | 3 |
| **Base reserve** | XAH an account must always keep to exist (1 XAH at the time of writing) | 0 |
| **Clawback** | The issuer taking its token back from a holder, destroying it. [Docs](https://docs.xahau.network/protocol-reference/transactions/transaction-types/clawback/) | 3 |
| **Coupon** | A bond's periodic interest payment | 5 |
| **Custodian** | Whoever holds the real asset (or the cash) that a token represents | 1 |
| **Deep freeze** | A freeze that also stops the holder receiving the token | 3 |
| **DefaultRipple** | An issuer setting that lets its token move between holders | 2 |
| **DepositAuth** | An account setting: only pre-approved senders may pay it | 3 |
| **DEX** | The exchange built into the ledger, where orders match automatically. [Docs](https://docs.xahau.network/features/network-features/offer/) | 4 |
| **Digest** | A 64-character fingerprint (SHA-256) of a document, stored on a URIToken | 6 |
| **Drop** | The smallest unit of XAH: 1 XAH = 1,000,000 drops | 0 |
| **DvP (delivery versus payment)** | Asset and payment change hands in the same step, or not at all | 4 |

### E to M

| Term | Meaning | Module |
|---|---|---|
| **Emit** | A Hook sending a new transaction by itself. [Docs](https://docs.xahau.network/hooks/concepts/emitted-transactions/) | 9 |
| **Escrow** | Funds locked on the ledger until a time or condition. [Docs](https://docs.xahau.network/features/network-features/escrow/) | 5 |
| **Face value** | What one bond token repays at maturity (100 USD for HBOND) | 1, 5 |
| **Fill or Kill** | An order flag: fill completely now, or do nothing | 4 |
| **Freeze** | The issuer stopping one holder from sending its token (except back to the issuer) | 3 |
| **Global freeze** | The issuer stopping all transfers of its token at once | 3 |
| **Hook** | A small program on an account that runs when transactions touch it. [Docs](https://docs.xahau.network/hooks/concepts/introduction/) | 9 |
| **IOU / issued token** | A currency created by an account (its issuer), held through trust lines: a claim on that issuer | 0, 2 |
| **Issuer** | The account that creates a token. Holders' balances are its obligations | 2 |
| **KYC** | "Know your customer": checking an investor's identity before they may hold the asset | 3 |
| **Ledger object** | One "thing" on the ledger (account, trust line, offer…) with its own ID. [Docs](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/) | 0 |
| **Mainnet / Testnet** | The real network / the practice network | 0, 11 |
| **Maturity** | The date a bond repays its face value | 5 |
| **Multisig** | Several keys signing together for one account. [Docs](https://docs.xahau.network/protocol-reference/transactions/transaction-types/signerlistset/) | 8 |

### N to S

| Term | Meaning | Module |
|---|---|---|
| **NAV** | Net asset value: what one unit of a fund or bond is worth, per its administrator | 7 |
| **NetworkID** | Which network a transaction is for: 21337 mainnet, 21338 testnet | 0 |
| **Obligations** | An issuer's tokens in other people's hands: its supply in circulation | 2 |
| **Offer** | An order to trade one currency for another. [Docs](https://docs.xahau.network/protocol-reference/transactions/transaction-types/offercreate/) | 4 |
| **Oracle** | Someone who publishes off-ledger facts (prices) on the ledger | 7 |
| **Owner reserve / OwnerCount** | 0.2 XAH locked per object an account owns / how many it owns | 0 |
| **Primary / secondary market** | Buying from the issuer / buying from another investor | 4 |
| **Record date** | The moment that decides who receives a payment | 5 |
| **Redemption** | Returning a token to the issuer for its value | 5 |
| **Remarks** | Small labelled notes written on a ledger object. [Docs](https://docs.xahau.network/protocol-reference/transactions/transaction-types/setremarks/) | 2, 6 |
| **RequireAuth** | An issuer setting: nobody may hold the token without its approval | 2, 3 |
| **Result code** | How a transaction ended: \`tes\` success, \`tec\` failed but recorded, \`tem\`… rejected. [Docs](https://docs.xahau.network/protocol-reference/transactions/transaction-results/) | 0 |
| **RWA** | Real-world asset: something that exists off the ledger (a building, a bond, gold) | 1 |
| **Seed** | The secret that controls an account. Never share it | 0 |
| **SPV** | Special purpose vehicle: a company that exists only to own one asset | 1 |
| **Stablecoin** | An issued token redeemable 1:1 for a fiat currency | 4 |
| **Strong / weak stakeholder** | An account whose Hook can block a transaction (strong) or only observe it (weak). [Docs](https://docs.xahau.network/hooks/concepts/weak-and-strong/) | 9 |

### T to X

| Term | Meaning | Module |
|---|---|---|
| **TickSize** | How many significant digits DEX prices of a token keep | 2 |
| **Tokenization** | Representing rights to an asset as tokens on a ledger | 1 |
| **Transaction** | A signed instruction, the only way the ledger changes. [Docs](https://docs.xahau.network/protocol-reference/transactions/transaction-types/) | 0 |
| **TransferRate** | A fee the issuer charges on transfers between holders | 2 |
| **Treasury / hot wallet** | The issuer's operating account; the issuer itself stays "cold" | 1, 2 |
| **Trust line** | An account's agreement to hold a token from an issuer (the \`RippleState\` object). [Docs](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/ripple-state/) | 0, 2 |
| **URIToken** | Xahau's unique token: a ledger object with an issuer, an owner and a URI. [Docs](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/uritoken/) | 6 |
| **Validated** | Included in a sealed ledger version: final | 0 |
| **XAH** | Xahau's own currency, used for fees and reserves | 0 |`,
      },
      slides: [
        {
          title: { en: "Glossary" },
          content: { en: "Every term, in plain words\nwith the module where it matters\nand a link to the Xahau docs" },
          visual: "📖",
        },
      ],
    },
  ],
}

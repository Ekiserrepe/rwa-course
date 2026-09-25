import { example } from '../example-code.js'

export default {
  id: "m8",
  icon: "🗝️",
  title: { en: "Keys and Governance" },
  lessons: [
    {
      id: "m8l1",
      title: { en: "The Issuer's Keys Are the Asset's Keys" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **Master key** | The key pair the account's address was derived from. It can be disabled, never changed. |
| **Regular key** | A second key pair an account can authorise, and replace at any time. |
| **Multisig** | Several keys signing one transaction together, per a signer list. |
| **Quorum** | The total signer weight a transaction needs. |
| **Key rotation** | Replacing a key with a new one, without changing the account. |

Any other term: see the [Glossary](?m=0&l=9).

Whoever controls the ISSUER can create unlimited HBOND, approve anyone, freeze anyone and claw back anything. For investors, **the issuer's key management is part of the asset's risk**, in the same way as the warehouse's roof.

### Three kinds of authority on one account

| | Master key | Regular key | Signer list (multisig) |
|---|---|---|---|
| Set by | Creating the account | \`SetRegularKey\` | \`SignerListSet\` |
| Can be replaced | **No**, only disabled | Yes | Yes |
| Signatures needed | 1 | 1 | Weighted quorum |
| Good for | Nothing, after setup | A single operator, rotatable | The issuer's day-to-day authority |

### The target setup for an issuer

1. Create the account and configure it with the master key (Module 2).
2. Install a **signer list**: several officers, each with their own key on their own device, and a quorum (lesson 2).
3. **Test** it: have the signers perform a real, harmless action (lesson 3).
4. **Disable the master key** (lesson 4). From then on, nothing happens without the quorum.

For the TREASURY, a regular key (rotatable) or a 2-of-3 list is usual: it signs often, and a stolen treasury key costs only what the treasury holds.

### In the Xahau docs

- [SetRegularKey](https://docs.xahau.network/protocol-reference/transactions/transaction-types/setregularkey/)
- [SignerListSet](https://docs.xahau.network/protocol-reference/transactions/transaction-types/signerlistset/)
- [AccountSet (asfDisableMaster)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)`,
      },
      slides: [
        {
          title: { en: "Key Risk = Asset Risk" },
          content: { en: "Issuer key → unlimited tokens,\nfreeze, clawback\n\nMaster (disable) · Regular (rotate)\nSigner list (quorum)" },
          visual: "🗝️",
        },
      ],
    },
    {
      id: "m8l2",
      title: { en: "A 2-of-3 Signer List" },
      theory: {
        en: `\`SignerListSet\` gives an account a list of signers, each with a weight, and a quorum:

\`\`\`json
{
  "TransactionType": "SignerListSet",
  "Account": "<ISSUER>",
  "SignerQuorum": 2,
  "SignerEntries": [
    { "SignerEntry": { "Account": "<CFO>", "SignerWeight": 1 } },
    { "SignerEntry": { "Account": "<COO>", "SignerWeight": 1 } },
    { "SignerEntry": { "Account": "<COUNSEL>", "SignerWeight": 1 } }
  ]
}
\`\`\`

Any two of the three can now sign for the issuer.

\`\`\`
CFO      rhRQVpTjQJUkUePveg9jS1t81MxJUgMjS2  (new, saved to .env)
COO      rHLpNfAmKkpje4qwYHsrync2MmSDqka4Nv  (new, saved to .env)
COUNSEL  rPqrG9h3tNecLEVChquY5Rk3zYFsM3xSuQ  (new, saved to .env)
✔ issuer: 2-of-3 signer list: tesSUCCESS
  quorum 2, 3 signers
\`\`\`

### Signers don't need funded accounts

The three officer keys were generated offline and **never funded**. A signer is just a key pair whose address appears in the list: it pays no fees and needs no reserve. (A signer can also be a real, funded account; then its own master or regular key signs.)

### Designing the list

- **Weights** let you express rules: CEO weight 2, two directors weight 1, quorum 2 = "the CEO alone, or both directors".
- **Tolerate a loss**: with 2-of-3, one lost key doesn't lock the issuer out, and one stolen key can't act alone.
- **Separate devices and people.** Three keys on one laptop is one key.
- **Replace** the list by sending \`SignerListSet\` again (signed by the current quorum); remove it with \`SignerQuorum: 0\`.
- The signer list is an object: it costs owner reserve.

### In the Xahau docs

- [SignerListSet](https://docs.xahau.network/protocol-reference/transactions/transaction-types/signerlistset/)
- [The SignerList object](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/signers-list/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/70-multisig-setup.js" },
          language: "javascript",
          code: example("70-multisig-setup.js"),
        },
      ],
      slides: [
        {
          title: { en: "2 of 3" },
          content: { en: "SignerQuorum: 2\nCFO · COO · COUNSEL, weight 1 each\n\nSigners need no XAH\nOne lost key: fine · one stolen key: harmless" },
          visual: "👥",
        },
      ],
    },
    {
      id: "m8l3",
      title: { en: "Acting as the Issuer with Two Signatures" },
      theory: {
        en: `A multisigned transaction is built once and signed separately by each signer, usually on different machines, then combined.

### The three steps

1. **Prepare.** Anyone builds the transaction and autofills it. Two differences from single-signing: \`client.autofill(tx, 2)\` sizes the fee for 2 signatures (a multisigned transaction costs more), and \`SigningPubKey\` is empty.
2. **Sign.** Each officer signs the **same** prepared transaction with \`wallet.sign(tx, true)\`: the \`true\` means "as one signer of a multisig".
3. **Combine and submit.** \`multisign([blobA, blobB])\` merges the signatures; submit the result.

The ISSUER's own seed is **never** used:

\`\`\`
✔ freeze carol (CFO + COUNSEL): tesSUCCESS
  CAROL: frozen = true
✔ unfreeze carol (CFO + COUNSEL): tesSUCCESS
  CAROL: frozen = false
\`\`\`

### Coordinating signers in practice

- The prepared transaction has a \`Sequence\` and a \`LastLedgerSequence\` deadline. If signatures take hours, the sequence may be used up or the deadline passed. Use **Tickets** (\`TicketCreate\`): each ticket is a reserved sequence number that doesn't expire, so a transaction can wait days for signatures. Set a generous \`LastLedgerSequence\` too, or leave it out, knowing that it then never expires.
- Signers should **read** what they sign. A multisig where every officer signs whatever the operator sends them is single-sig with extra steps. Decode the transaction (every wallet does) and check the destination, currency, issuer and amount.

### In the Xahau docs

- [Multi-signing](https://docs.xahau.network/features/transaction-signing/)
- [TicketCreate](https://docs.xahau.network/protocol-reference/transactions/transaction-types/ticketcreate/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/71-multisig-freeze.js" },
          language: "javascript",
          code: example("71-multisig-freeze.js"),
        },
      ],
      slides: [
        {
          title: { en: "Multisign in 3 Steps" },
          content: { en: "1. autofill(tx, signerCount)\n2. each signer: sign(tx, true)\n3. multisign([...]) → submit\n\nIssuer seed never touched" },
          visual: "✍️",
        },
      ],
    },
    {
      id: "m8l4",
      title: { en: "Disabling the Master Key, and When Keys Go Wrong" },
      theory: {
        en: `### Disable the master key, last

Once the signer list has been **tested** (lesson 3), the issuer sends:

\`\`\`json
{ "TransactionType": "AccountSet", "Account": "<ISSUER>", "SetFlag": 4 }
\`\`\`

\`asfDisableMaster\` (4) makes the master key useless. We tried it on a scratch account:

\`\`\`
✘ disable master, no regular key/signer list: tecNO_ALTERNATIVE_KEY
✔ signer list 1-of-1: tesSUCCESS
✔ disable master, with signer list: tesSUCCESS
  master key after disabling → tefMASTER_DISABLED
\`\`\`

The ledger refuses to disable it unless the account has a regular key or a signer list, so you can't lock yourself out by accident. But you **can** lock yourself out with a signer list whose keys you've lost. Test first; the course's ISSUER keeps its master key only so the lessons stay simple.

To re-enable the master key later, the quorum signs \`ClearFlag: 4\`.

### Incident playbook

| What happened | Do this |
|---|---|
| A **treasury** key leaked | Freeze the treasury's HBOND line (issuer quorum). Move what you can to a new treasury. Claw back from the old one if needed. Unfreeze nothing until you understand how it leaked |
| **One officer's** key lost or stolen | The other two replace the signer list, without that key |
| **Two officers'** keys stolen | They can act as the issuer: global freeze first (if you still can), then the legal process. This is why keys must be spread across people and places |
| An **investor** lost their key | Freeze, claw back, KYC a new address, re-issue (the capstone's incident) |
| Every issuer key lost | The token can't be administered anymore. Only a new issuer and a migration (with holders' cooperation) fixes it |

### Testnet is not a rehearsal for keys

Everything in this course keeps seeds in \`.env\`. On mainnet, issuer signers use hardware wallets or an HSM, signing happens on separate machines, and the seed is never typed into a server. Module 11 has the checklist.

### In the Xahau docs

- [AccountSet (asfDisableMaster)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)
- [SetRegularKey](https://docs.xahau.network/protocol-reference/transactions/transaction-types/setregularkey/)`,
      },
      slides: [
        {
          title: { en: "Master Key Off, Last" },
          content: { en: "SetFlag 4 = asfDisableMaster\nOnly after the signer list is tested\n\nLost list keys = locked issuer" },
          visual: "🔒",
        },
        {
          title: { en: "When Keys Go Wrong" },
          content: { en: "Treasury leak → freeze, move, claw back\nOne officer → replace the list\nInvestor → freeze, clawback, re-issue" },
          visual: "🚨",
        },
      ],
    },
  ],
}

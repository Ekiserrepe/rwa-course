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

1. Create the account and configure it with the master key ([Module 2](?m=2&l=0)).
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

The argument is the **holder** to freeze, not a signer: \`node 71-multisig-freeze.js CAROL\` freezes CAROL's line, and \`--off\` lifts it. The signers are always CFO and COUNSEL, and the ISSUER's own seed is **never** used:

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
        en: `### Three ways an account can sign

Every account on Xahau is born with a **master key**: the key pair derived from the seed that created it. Two more ways to sign can be added later:

| | Master key | Regular key | Signer list |
|---|---|---|---|
| What it is | The key pair behind the account's address | One extra key pair, set with \`SetRegularKey\` | Several keys with weights and a quorum, set with \`SignerListSet\` (lesson 2) |
| Can it be replaced? | **No.** It is tied to the address forever | Yes, by setting a new one | Yes, by the quorum signing a new list |
| Can it be switched off? | Yes, with \`asfDisableMaster\` | Yes, by removing it | Yes, by deleting the list |
| One person can act alone? | Yes | Yes | Only if the quorum is 1 |

The first row is the important one. The master key can't be rotated: whoever has a copy of the seed has full control of the account for as long as the key works. For an ordinary wallet that's acceptable. For an issuer it isn't. The issuer's seed existed on the machine that created the account, perhaps in a backup or a password manager, and a single leak would give someone the power to issue, freeze and claw back HBOND for the life of the bond.

So once the officers' signer list is in place, the issuer **switches the master key off**. From then on, only the quorum can act, and the quorum's keys can be replaced whenever an officer leaves or a key is compromised.

### The order matters

1. **Install the signer list** ([lesson 2](?m=8&l=1)).
2. **Use it for a real action** ([lesson 3](?m=8&l=2)): a multisigned freeze and unfreeze proves that the signers hold working keys and can coordinate.
3. **Disable the master key**, with an \`AccountSet\` signed by the master key itself:

\`\`\`json
{ "TransactionType": "AccountSet", "Account": "<ISSUER>", "SetFlag": 4 }
\`\`\`

\`SetFlag: 4\` is \`asfDisableMaster\`. The flag can be cleared later with \`ClearFlag: 4\`, but only by a transaction the signer list signs, since the master key no longer can.

Skipping step 2 is the dangerous mistake. The ledger can't know whether the officers really hold their keys. If they don't, disabling the master key leaves an issuer nobody can sign for.

### What the ledger allows, step by step

\`72-disable-master.js\` walks through the rules on a throwaway account, never on the ISSUER:

\`\`\`
✔ create a scratch account: tesSUCCESS
✘ disable master, no regular key/signer list: tecNO_ALTERNATIVE_KEY
✔ signer list 1-of-1: tesSUCCESS
✔ disable master, with signer list: tesSUCCESS
  master key after disabling → tefMASTER_DISABLED
\`\`\`

- **\`tecNO_ALTERNATIVE_KEY\`**: with no regular key and no signer list, the ledger refuses to disable the master key. Without it the account would have no way to sign at all, and this rule prevents that.
- **With a signer list**, the same transaction succeeds.
- **\`tefMASTER_DISABLED\`**: anything signed with the master key afterwards is rejected before it reaches a ledger. A \`tef\` code means the transaction was never applied, so it costs nothing and changes nothing.

The ledger's safeguard has a limit: it checks that another way to sign **exists**, not that anyone can still **use** it. A signer list whose keys are lost passes the check and still locks the account for good. That is why step 2 comes first.

The course's ISSUER keeps its master key so that every script in the course can keep signing with one seed. A production issuer shouldn't.

### When keys go wrong

The right response depends on **which** key is affected and **who can still reach the quorum**. Keep one distinction in mind: a key that is *stolen* has been copied, and the officers still hold it too, so both sides can use it and speed matters. A key that is *lost* is simply gone.

| What happened | Why it matters | Do this |
|---|---|---|
| A **treasury** key leaked | The treasury is an ordinary holder: whoever has its key can move its HBOND and USD | The issuer's quorum **freezes the treasury's HBOND line** at once: frozen HBOND can only go back to the issuer. Move the USD, which the issuer can't freeze, to a new treasury. Claw back the old treasury's HBOND and re-issue it to the new one. Find out how the key leaked before trusting the new setup |
| **One officer's** key lost or stolen | The other two still reach the 2-of-3 quorum | They sign a new \`SignerListSet\` that replaces that key with a fresh one. Until then the old key alone can't do anything |
| **Two officers'** keys stolen | The attacker now reaches the quorum and can act as the issuer, including replacing the signer list to lock the officers out | The officers hold the same keys and must act first: **replace the signer list** with new keys immediately, then consider a **global freeze** while the damage is assessed, then the legal process. The best defence is prevention: keep keys with different people, in different places, on hardware wallets |
| An **investor** lost their key | Their tokens are stuck: nobody can move tokens out of an account without its key | Freeze the old line, claw back, complete KYC for the investor's new address, re-issue. The capstone runs this procedure ([Module 10](?m=10&l=3)) |
| **Every** issuer key lost | Nobody can issue, freeze or claw back any more. Transfers between holders keep working under the settings already in place | The token can't be administered. The only remedy is a new issuer and a migration to a new token, with the holders' cooperation |

### Testnet is not a rehearsal for keys

Every script in this course reads its seeds from \`.env\`, which is fine for testnet and nothing else. On mainnet, issuer signers keep their keys on hardware wallets or in an HSM, each officer signs on their own device, and no seed is ever typed into a server. [Module 11](?m=11&l=3) turns this into a checklist.

### In the Xahau docs

- [AccountSet (asfDisableMaster)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/accountset/)
- [SetRegularKey](https://docs.xahau.network/protocol-reference/transactions/transaction-types/setregularkey/)
- [SignerListSet](https://docs.xahau.network/protocol-reference/transactions/transaction-types/signerlistset/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/72-disable-master.js" },
          language: "javascript",
          code: example("72-disable-master.js"),
        },
      ],
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

import { example } from '../example-code.js'

export default {
  id: "m6",
  icon: "📜",
  title: { en: "Unique Assets: Deeds and Documents as URITokens" },
  lessons: [
    {
      id: "m6l1",
      title: { en: "One Asset, One Token" },
      theory: {
        en: `### New words in this module

| Word | What it means |
|---|---|
| **URIToken** | Xahau's unique token: one ledger object with an issuer, an owner and a URI. |
| **URI** | A link to the asset's documentation: \`ipfs://…\` or \`https://…\`, up to 256 bytes. |
| **Digest** | A 64-character SHA-256 fingerprint of a document, stored on the token when it's minted. |
| **Burnable** | A mint flag that lets the issuer destroy the token later, even when someone else owns it. |
| **URITokenID** | The token's unique ID, calculated from its issuer and its URI. |

Any other term: see the [Glossary](?m=0&l=9).

Some assets are not divisible into interchangeable units: **this** title deed, **this** invoice, **this** warehouse receipt. Each needs its own token. On Xahau that's a **URIToken**.

### What a URIToken is

A URIToken is its own ledger object:

| Field | Meaning | Changes? |
|---|---|---|
| \`Issuer\` | Who minted it: the registrar, or the SPV | Never |
| \`Owner\` | Who holds it now | On every sale |
| \`URI\` | Link to the documentation | Never |
| \`Digest\` | SHA-256 of the document | Never |
| \`Flags\` | \`1\` = burnable | Never |
| \`Remarks\` | Labelled notes, set by the issuer | Yes, unless immutable |

Its **ID** is \`SHA-512Half(issuer + URI)\`, known before minting (\`hashes.hashURIToken\`), so the same issuer can't mint two tokens with the same URI. A registry that mints one token per parcel should put the parcel identifier in the URI: then a duplicate deed for the same parcel is **impossible**, not just forbidden.

### Choosing the URI

- **IPFS** (\`ipfs://<CID>\`): the address is calculated from the file's content, so it can never point to a different document. You must keep the file pinned.
- **Your registry's URL** (\`https://registry.example/deeds/PX-2291-0007\`): readable and under your control, but the content behind it can change. That's what the Digest is for.

The course's script adds \`?run=<timestamp>\` to the URI only so that each course run mints a new token; a real deed would use a permanent URI.

### Burnable: the registrar's safety valve

With \`tfBurnable\`, the issuer can destroy the token **even after selling it**. For a deed that mirrors a legal register, that's how a court-ordered correction reaches the ledger. Without it, a mistaken deed token lives forever. Like clawback for issued tokens, it's a power your terms must describe.

### In the Xahau docs

- [URITokens](https://docs.xahau.network/features/network-features/uritoken/)
- [The URIToken object](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/uritoken/)
- [URITokenMint](https://docs.xahau.network/protocol-reference/transactions/transaction-types/uritokenmint/)`,
      },
      slides: [
        {
          title: { en: "URIToken" },
          content: { en: "Issuer (fixed) · Owner (moves)\nURI + Digest (fixed)\nRemarks (issuer-controlled)\n\nID = hash(issuer + URI): no duplicates" },
          visual: "📜",
        },
      ],
    },
    {
      id: "m6l2",
      title: { en: "Fingerprint the Document, Then Mint" },
      theory: {
        en: `### A fingerprint: SHA-256

**SHA-256** turns any file into 32 bytes (64 hex characters). The same file always gives the same result, and changing even one character gives a completely different one. Nobody can craft a different file with the same fingerprint.

\`\`\`
assets/warehouse-deed.txt (664 bytes)
  SHA-256: B0C11A612B810B1F567DDF86593739C6A85927781468ECF45D0A0FA517CBD980
  after changing the valuation: 9EA4275B2F29889F75462BA946EBB4E7C621C01ED7B04D1C97E3050643A0D896
\`\`\`

"1,150,000" became "1,950,000" and the fingerprint has nothing in common with the original.

### Minting the deed

\`URITokenMint\` with the URI (hex), the document's fingerprint as \`Digest\`, and \`Flags: 1\` (burnable):

\`\`\`
✔ mint the deed: tesSUCCESS
  URITokenID: F655F4B552C163F940492B72035C318286B5A16C293BC259A855D676CA8D981C
  Owner:  rN4AAuFksWwA2fwV3mgRNVNirMKqfRRpZT
  Digest: B0C11A612B810B1F567DDF86593739C6A85927781468ECF45D0A0FA517CBD980
\`\`\`

The ISSUER (the SPV) mints it and owns it: the SPV owns the warehouse, and the token says so.

### What goes in the document, and what doesn't

The document the Digest covers is the **off-ledger legal record**. The file itself does not go on the ledger, only its fingerprint. So it can contain what the ledger must never show (owners' names, if the register has them), as long as whoever needs to verify it can get a copy. The fingerprint reveals nothing about the content.

One practical warning: the fingerprint covers **bytes**, not meaning. Re-saving a PDF, changing line endings or re-encoding a text file changes it. Store the exact original.

### In the Xahau docs

- [URITokenMint (Digest, flags)](https://docs.xahau.network/protocol-reference/transactions/transaction-types/uritokenmint/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/assets/warehouse-deed.txt" },
          language: "text",
          code: example("assets/warehouse-deed.txt"),
        },
        {
          title: { en: "examples/50-document-digest.js" },
          language: "javascript",
          code: example("50-document-digest.js"),
        },
        {
          title: { en: "examples/51-mint-deed.js" },
          language: "javascript",
          code: example("51-mint-deed.js"),
        },
      ],
      slides: [
        {
          title: { en: "SHA-256" },
          content: { en: "Any file → 64 hex characters\nSame file → same digest\nOne character changed → unrelated digest\n\nOnly the digest goes on the ledger" },
          visual: "🔏",
        },
      ],
    },
    {
      id: "m6l3",
      title: { en: "Facts on the Token: Remarks" },
      theory: {
        en: `The Digest proves **which** document; **Remarks** put the key facts right on the token, readable by any wallet or explorer without fetching anything.

### Immutable and mutable

\`\`\`
✔ describe the deed: tesSUCCESS
✔ update valuation: tesSUCCESS
✘ try to change the parcel: tecIMMUTABLE
  jurisdiction  Port Example land registry  (immutable)
  lien          pledged to HBOND holders
  parcel        PX-2291-0007  (immutable)
  valuation     1185000 USD @ 2027-06-30
\`\`\`

- \`parcel\` and \`jurisdiction\` are set with \`Flags: 1\` (immutable): the ledger refuses to change them, ever (\`tecIMMUTABLE\`). They identify the asset; if they could change, the token could be quietly re-pointed at a different property.
- \`lien\` and \`valuation\` are mutable: the lien is released when the bond is repaid, the valuation updated every year.

### Only the issuer writes Remarks

On a URIToken, **only its issuer** can set Remarks; the owner gets \`tecNO_PERMISSION\` (shown in the companion URIToken course). For a registry that's exactly right: after the deed is sold, the buyer owns the token, but the registrar keeps authority over what the token says about the property.

### Rules

- Up to 32 remarks per object, names and values up to 256 bytes each.
- Several remarks in one \`SetRemarks\`; each byte costs 1 extra drop.
- A remark without a value deletes it (unless immutable).
- Remarks are public. Facts about the property, yes; facts about people, never.

### In the Xahau docs

- [SetRemarks](https://docs.xahau.network/protocol-reference/transactions/transaction-types/setremarks/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/52-deed-remarks.js" },
          language: "javascript",
          code: example("52-deed-remarks.js"),
        },
      ],
      slides: [
        {
          title: { en: "Remarks on a Deed" },
          content: { en: "parcel, jurisdiction → immutable\nlien, valuation → updatable\n\nChanging an immutable one: tecIMMUTABLE\nOnly the issuer can write" },
          visual: "🏷️",
        },
      ],
    },
    {
      id: "m6l4",
      title: { en: "Verify Before You Rely" },
      theory: {
        en: `A lender taking the warehouse as collateral, a buyer, an auditor: each should check the token against the document they were given, **from the ledger**, before relying on either.

### Three checks

1. **Right issuer.** The token's \`Issuer\` is the registrar or SPV they expect, by address, not by name.
2. **Has a Digest.** A deed token without one proves nothing about any document.
3. **Digest matches.** Hash the document in hand and compare.

\`\`\`
URI: https://harbor-bond.example/deeds/PX-2291-0007?run=1789969191741
Owner: rN4AAuFksWwA2fwV3mgRNVNirMKqfRRpZT
  ✔ issued by the expected issuer
  ✔ has a Digest
  ✔ Digest matches the document
\`\`\`

With the one-character forgery from lesson 2:

\`\`\`
  ✔ issued by the expected issuer
  ✔ has a Digest
  ✘ Digest matches the document
\`\`\`

and the script exits with code 2, so it can gate an automated process.

### What the check proves, and what it doesn't

It proves that **this document is the one the issuer committed to when it minted**, and that the token hasn't been burned. It doesn't prove the document is true: that the warehouse exists, or that the valuation is honest. That's the legal layer again ([Module 1](?m=1&l=1)). The ledger's job is to make sure everyone is at least talking about the same document.

### In the Xahau docs

- [ledger_entry](https://docs.xahau.network/features/http-websocket-apis/public-api-methods/)
- [The URIToken object](https://docs.xahau.network/protocol-reference/ledger-data/ledger-objects-types/uritoken/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/53-verify-deed.js" },
          language: "javascript",
          code: example("53-verify-deed.js"),
        },
      ],
      slides: [
        {
          title: { en: "Three Checks" },
          content: { en: "1. Issuer = expected address\n2. Digest present\n3. sha256(document) = Digest\n\nProves: same document. Not: true document" },
          visual: "✅",
        },
      ],
    },
    {
      id: "m6l5",
      title: { en: "Linking the Deed to the Bond, and Selling It" },
      theory: {
        en: `### Two-way links on the ledger

Harbor Bond's investors are told the bond is secured by the warehouse. The ledger can show that link from both sides:

- On the **deed**, an immutable remark \`secures = <HBOND code>.<issuer address>\`.
- On the **issuer account**, a remark \`collateral = <deed URITokenID>\`.

\`\`\`
✔ deed -> bond: tesSUCCESS
✔ issuer -> deed: tesSUCCESS
Issuer account remarks:
  collateral         F655F4B552C163F940492B72035C318286B5A16C293BC259A855D676CA8D981C
  legal_name         Harbor Bond SPV Ltd.
  prospectus_sha256  2B87B63A17DCEA6766AFA46D000BB32108EFD26492C48089D4B3E00D0C4F9EB0
  status             offering open
  token              48424F4E44000000000000000000000000000000 (HBOND): 100 USD face, 5% fixed, matures 2030-06-30
\`\`\`

An investor who starts from their HBOND trust line finds the issuer, its fact sheet and the deed; a lender who starts from the deed finds the bond. This is the fractional-ownership pattern from [Module 1](?m=1&l=2), with the links written into the ledger instead of a PDF.

### Selling the deed: DvP for a unique asset

At maturity the SPV may sell the warehouse to repay the bond. A URIToken sale is also delivery versus payment:

1. The owner lists it with \`URITokenCreateSellOffer\`, priced in USD, with a \`Destination\` so only the agreed buyer can take it.
2. The buyer reads the listing, then sends \`URITokenBuy\` with exactly that \`Amount\`.

\`\`\`
✔ offer the deed to bob for 1000 USD: tesSUCCESS
  listed at 1000 USD, only for r4EWm17wpwAvThQQGGr9TCxN2aKaUKBSYP
✔ bob buys the deed: tesSUCCESS
  owner is now BOB, issuer still rN4AAuFksWwA2fwV3mgRNVNirMKqfRRpZT
\`\`\`

(The price is scaled down so the test buyer can afford it.) Two points to keep in mind:

- The ISSUER had **no USD trust line** before the sale, yet it received the 1,000 USD: the purchase created the seller's line for it.
- The **issuer is still the issuer**. It can still update the remarks (say, \`lien\` → released) and, because the deed is burnable, still revoke it. The buyer should check both before paying (lesson 4).

### A tip from the URIToken course

Paying **more** than the listed price with \`URITokenBuy\` succeeds, and the seller keeps the difference. Always read the listing and send exactly its \`Amount\`, as \`55-sell-deed.js\` does.

### In the Xahau docs

- [URITokenCreateSellOffer](https://docs.xahau.network/protocol-reference/transactions/transaction-types/uritokencreateselloffer/)
- [URITokenBuy](https://docs.xahau.network/protocol-reference/transactions/transaction-types/uritokenbuy/)
- [SetRemarks](https://docs.xahau.network/protocol-reference/transactions/transaction-types/setremarks/)`,
      },
      codeBlocks: [
        {
          title: { en: "examples/54-link-deed.js" },
          language: "javascript",
          code: example("54-link-deed.js"),
        },
        {
          title: { en: "examples/55-sell-deed.js" },
          language: "javascript",
          code: example("55-sell-deed.js"),
        },
      ],
      slides: [
        {
          title: { en: "Linked Both Ways" },
          content: { en: "Deed remark: secures = HBOND.issuer\nIssuer remark: collateral = deed ID\n\nStart anywhere, find everything" },
          visual: "🔗",
        },
        {
          title: { en: "Selling a Deed" },
          content: { en: "Sell offer in USD + Destination\nBuyer pays exactly Amount\nDeed and USD swap in one tx\n\nIssuer keeps Remarks + burn power" },
          visual: "🏠",
        },
      ],
    },
  ],
}

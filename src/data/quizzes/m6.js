/**
 * Module 6: Unique assets.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m6q1",
    question: { en: "What does a URIToken's Digest prove?" },
    options: [
      { en: "That the document is true" },
      { en: "That the document in hand is the one the issuer committed to at mint" },
      { en: "Who owns the property" },
    ],
    answer: 1,
    explain: { en: "It's a fingerprint: it proves the same document, not a true one." },
  },
  {
    id: "m6q2",
    question: { en: "The issuer tries to change an immutable remark. Result?" },
    options: [
      { en: "tecIMMUTABLE" },
      { en: "tesSUCCESS" },
      { en: "The remark is deleted" },
    ],
    answer: 0,
    explain: { en: "Immutable remarks can never change or be deleted." },
  },
  {
    id: "m6q3",
    question: { en: "Why put the parcel identifier in the deed's URI?" },
    options: [
      { en: "The URITokenID is derived from issuer + URI, so a duplicate deed for the parcel becomes impossible" },
      { en: "It's required" },
      { en: "Wallets display it" },
    ],
    answer: 0,
    explain: { en: "The same issuer can't mint two tokens with the same URI." },
  },
  {
    id: "m6q4",
    question: { en: "After selling the deed, what can the issuer still do?" },
    options: [
      { en: "Nothing" },
      { en: "Update its remarks, and burn it if minted burnable" },
      { en: "Sell it again" },
    ],
    answer: 1,
    explain: { en: "The issuer never changes: it keeps control of remarks and, with tfBurnable, can revoke." },
  },
]

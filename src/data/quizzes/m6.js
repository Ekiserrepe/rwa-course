/**
 * Module 6: Unique assets.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m6q1",
    question: { en: "What does a URIToken's Digest prove?" },
    options: [
      { en: "That the document's contents are true" },
      { en: "Who owns the property today" },
      { en: "That the document in hand is the one the issuer committed to at mint" },
    ],
    answer: 2,
    explain: { en: "A digest proves integrity, not truth: the same bytes the issuer fingerprinted." },
  },
  {
    id: "m6q2",
    question: { en: "The issuer tries to change an immutable remark. Result?" },
    options: [
      { en: "tesSUCCESS, the new value replaces it" },
      { en: "tecIMMUTABLE" },
      { en: "The remark is deleted" },
    ],
    answer: 1,
    explain: { en: "An immutable remark can never change, not even by the issuer." },
  },
  {
    id: "m6q3",
    question: { en: "The parcel ID is in the deed's URI. Can the same issuer ever mint a second token for that parcel?" },
    options: [
      { en: "Not while the first exists; after a burn the URI is free again" },
      { en: "Never" },
      { en: "Only with a different Digest" },
    ],
    answer: 0,
    explain: { en: "The ID is derived from issuer + URI, so two live tokens can't share a URI. A burned token frees it for a corrected reissue." },
  },
  {
    id: "m6q4",
    question: { en: "After selling the deed, what can the issuer still do?" },
    options: [
      { en: "Transfer it back without the buyer" },
      { en: "Nothing at all" },
      { en: "Update its mutable remarks, and burn it if minted burnable" },
    ],
    answer: 2,
    explain: { en: "Remarks stay under the issuer's control; tfBurnable is the registrar's safety valve." },
  },
]

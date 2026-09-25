/**
 * Module 3: Compliance.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m3q1",
    question: { en: "CAROL has a trust line that was never authorised. The issuer pays her directly. Result?" },
    options: [
      { en: "tesSUCCESS" },
      { en: "Her line is authorised automatically" },
      { en: "tecPATH_DRY" },
    ],
    answer: 2,
    explain: { en: "With RequireAuth, not even the issuer can pay an unapproved line." },
  },
  {
    id: "m3q2",
    question: { en: "ALICE is frozen (regular freeze). Which still works?" },
    options: [
      { en: "ALICE sends to BOB" },
      { en: "Neither" },
      { en: "BOB sends to ALICE" },
    ],
    answer: 2,
    explain: { en: "A regular freeze stops sending, not receiving. A deep freeze stops receiving too." },
  },
  {
    id: "m3q3",
    question: { en: "A holder is deep-frozen. Can they still pay tokens back to the issuer?" },
    options: [
      { en: "No" },
      { en: "Only with multisig" },
      { en: "Yes" },
    ],
    answer: 2,
    explain: { en: "Every freeze leaves the issuer path open, so a frozen holder can always be redeemed." },
  },
  {
    id: "m3q4",
    question: { en: "In a Clawback transaction, what goes in Amount.issuer?" },
    options: [
      { en: "The token issuer" },
      { en: "The treasury" },
      { en: "The holder to claw back from" },
    ],
    answer: 2,
    explain: { en: "It's the account the tokens are taken from: the field that trips everyone up." },
  },
  {
    id: "m3q5",
    question: { en: "Why did escrowing HBOND fail with tecNO_PERMISSION?" },
    options: [
      { en: "The issuer has clawback enabled, which rules out locked token balances" },
      { en: "Escrow only works for XAH" },
      { en: "The escrow was too short" },
    ],
    answer: 0,
    explain: { en: "xahaud refuses to create locked token balances for an issuer with lsfAllowTrustLineClawback." },
  },
]

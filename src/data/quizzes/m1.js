/**
 * Module 1: RWA fundamentals.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m1q1",
    question: { en: "What does a token for a real-world asset actually record?" },
    options: [
      { en: "The asset itself" },
      { en: "The asset's market price" },
      { en: "Who holds a legal claim to the asset" },
    ],
    answer: 2,
    explain: { en: "The asset stays off the ledger; the token records who holds the claim, which the legal wrapper makes enforceable." },
  },
  {
    id: "m1q2",
    question: { en: "Why is the issuer kept separate from the treasury?" },
    options: [
      { en: "The issuer's key can create unlimited tokens and the account can never be replaced" },
      { en: "Xahau limits each account to one currency" },
      { en: "The treasury pays lower fees" },
    ],
    answer: 0,
    explain: { en: "A leaked treasury key costs what the treasury holds and the treasury can be swapped; the issuer account is the token." },
  },
  {
    id: "m1q3",
    question: { en: "Which model fits a single title deed?" },
    options: [
      { en: "A URIToken" },
      { en: "An issued token (IOU)" },
      { en: "XAH" },
    ],
    answer: 0,
    explain: { en: "One-of-a-kind assets are URITokens; fungible claims such as bond units are issued tokens." },
  },
  {
    id: "m1q4",
    question: { en: "Can an issuer's Hook block a transfer of its token between two holders?" },
    options: [
      { en: "Yes, always" },
      { en: "No: the issuer is only a weak stakeholder of such transfers" },
      { en: "Only on mainnet" },
    ],
    answer: 1,
    explain: { en: "Module 9 tests it: the issuer's Hook isn't asked, or runs afterwards with a collect call and can't refuse." },
  },
]

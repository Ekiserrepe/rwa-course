/**
 * Module 1: RWA fundamentals.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m1q1",
    question: { en: "An investor holds 10 HBOND. What does the ledger actually record?" },
    options: [
      { en: "Who holds a claim, whose meaning the legal documents define" },
      { en: "The warehouse itself, which moves with the token" },
      { en: "The bond's current market price" },
    ],
    answer: 0,
    explain: { en: "The token records who holds a claim. What that claim is worth and what it entitles you to comes from the legal wrapper off the ledger." },
  },
  {
    id: "m1q2",
    question: { en: "Why is the issuer a separate, cold account instead of the account that sells and pays?" },
    options: [
      { en: "Xahau allows one currency per account" },
      { en: "A hot account pays lower fees" },
      { en: "Its key can create unlimited tokens and the account can't be replaced, so it should sign as little as possible" },
    ],
    answer: 2,
    explain: { en: "The issuer's key is the most powerful one. Daily operations go through the treasury, whose key can be rotated." },
  },
  {
    id: "m1q3",
    question: { en: "A registrar wants one token per title deed, each with its own document. Which model fits?" },
    options: [
      { en: "An issued token with a supply of 1" },
      { en: "A URIToken" },
      { en: "A trust line per deed" },
    ],
    answer: 1,
    explain: { en: "A URIToken is unique, carries its URI and Digest, and has one owner at a time." },
  },
  {
    id: "m1q4",
    question: { en: "Can the issuer's Hook refuse a transfer of HBOND between two holders?" },
    options: [
      { en: "No: the issuer is only a weak stakeholder, and a weak Hook runs after the transfer and can't roll it back" },
      { en: "Yes, if the Hook is installed with a collect call" },
      { en: "Yes, if HookOn includes Payment" },
    ],
    answer: 0,
    explain: { en: "Only strong stakeholders (sender, destination) can refuse. The issuer's controls for holder-to-holder rules are native: authorisation, freeze, clawback." },
  },
]

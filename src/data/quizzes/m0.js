/**
 * Module 0: Setup.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m0q1",
    question: { en: "Why does lib/xahau.js's submit() not throw when a transaction returns a tec code?" },
    options: [
      { en: "tec codes are warnings and change nothing" },
      { en: "A tec transaction was included in a ledger and charged a fee, and many lessons provoke them on purpose" },
      { en: "Because submitAndWait never reports tec codes" },
    ],
    answer: 1,
    explain: { en: "tec results reach a ledger and cost the fee without doing what was asked. The helper reports them and lets each script decide." },
  },
  {
    id: "m0q2",
    question: { en: "Who pays the reserve for an investor's HBOND trust line?" },
    options: [
      { en: "The investor, who created the line" },
      { en: "The issuer" },
      { en: "Nobody: trust lines are free" },
    ],
    answer: 0,
    explain: { en: "The account that creates a line with a non-zero limit owns it and locks 0.2 XAH for it." },
  },
  {
    id: "m0q3",
    question: { en: "Which role in the course never passes KYC?" },
    options: [
      { en: "CAROL" },
      { en: "BOB" },
      { en: "TREASURY" },
    ],
    answer: 0,
    explain: { en: "CAROL opens a trust line but is never approved, so every lesson can show a door that stays closed." },
  },
  {
    id: "m0q4",
    question: { en: "What does 'validated' mean on Xahau?" },
    options: [
      { en: "Probably final, may be reorganised" },
      { en: "Included in a sealed ledger version: final" },
      { en: "Signed but not yet submitted" },
    ],
    answer: 1,
    explain: { en: "Once a ledger including the transaction is validated, it is final." },
  },
]

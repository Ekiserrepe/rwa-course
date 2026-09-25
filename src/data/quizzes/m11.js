/**
 * Module 11: Production.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m11q1",
    question: { en: "How do you confirm that mainnet supports the amendments your flows use?" },
    options: [
      { en: "Assume testnet matches" },
      { en: "Ask the mainnet node with the feature command" },
      { en: "Read a blog post" },
    ],
    answer: 1,
    explain: { en: "Testnet runs ahead of mainnet; check each amendment is enabled on the network you launch on." },
  },
  {
    id: "m11q2",
    question: { en: "What does 90-preflight.js treat as a blocker?" },
    options: [
      { en: "No signer list on the issuer" },
      { en: "Master key still enabled" },
      { en: "No transfer fee" },
    ],
    answer: 0,
    explain: { en: "Multisig is a MUST; disabling the master key is a SHOULD, done only after testing." },
  },
  {
    id: "m11q3",
    question: { en: "Where may personal data about investors go on the ledger?" },
    options: [
      { en: "In Remarks, if encrypted" },
      { en: "In memos" },
      { en: "Nowhere" },
    ],
    answer: 2,
    explain: { en: "The ledger is public and permanent. It records that an account was approved, never who owns it." },
  },
]

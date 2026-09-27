/**
 * Module 11: Production.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m11q1",
    question: { en: "How do you confirm mainnet supports the amendments your flows use?" },
    options: [
      { en: "Assume it matches testnet" },
      { en: "Run 90-preflight.js against mainnet: it asks the node (feature) and blocks on any missing one" },
      { en: "Check the release notes of xahau.js" },
    ],
    answer: 1,
    explain: { en: "Testnet runs ahead of mainnet. Ask the network you launch on." },
  },
  {
    id: "m11q2",
    question: { en: "NETWORK points at mainnet by mistake and you run 10-issuer-setup.js. What happens?" },
    options: [
      { en: "connect() refuses: NetworkID isn't testnet and ALLOW_MAINNET isn't set" },
      { en: "It sets the permanent flags on the real issuer" },
      { en: "autofill switches back to testnet" },
    ],
    answer: 0,
    explain: { en: "The guard exists because some flags can never be undone." },
  },
  {
    id: "m11q3",
    question: { en: "What does 90-preflight.js treat as a blocker?" },
    options: [
      { en: "Master key still enabled" },
      { en: "No transfer fee" },
      { en: "No signer list on the issuer" },
    ],
    answer: 2,
    explain: { en: "Multisig is a MUST; disabling the master key is a SHOULD, decided consciously." },
  },
  {
    id: "m11q4",
    question: { en: "Where may personal data about investors go on the ledger?" },
    options: [
      { en: "In Remarks, if encrypted" },
      { en: "Nowhere" },
      { en: "In memos, which aren't indexed" },
    ],
    answer: 1,
    explain: { en: "The ledger is public and permanent. Identities stay with you and your KYC provider." },
  },
]

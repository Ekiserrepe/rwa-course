/**
 * Module 0: Setup.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m0q1",
    question: { en: "A script's DepositAuth demo shows BOB refused with tecNO_PERMISSION, as intended. Why does the script still exit with code 0?" },
    options: [
      { en: "submit() ignores every tec code" },
      { en: "tec codes never reach a ledger, so there is nothing to report" },
      { en: "The call lists tecNO_PERMISSION in expect, so that refusal doesn't count as a failure" },
    ],
    answer: 2,
    explain: { en: "submit() sets exit code 1 for any result but tesSUCCESS, unless the call lists that code in expect: a refusal the lesson demonstrates on purpose." },
  },
  {
    id: "m0q2",
    question: { en: "You paste an ed25519 seed (sEd…) into .env. What must the code that loads it do?" },
    options: [
      { en: "Call Wallet.fromSeed(seed) with no options" },
      { en: "Read the type from the seed (decodeSeed) and pass that algorithm" },
      { en: "Pass { algorithm: \"ecdsa-secp256k1\" }, like the faucet's seeds" },
    ],
    answer: 1,
    explain: { en: "A seed records its own algorithm, but Wallet.fromSeed assumes ed25519 unless told. The wrong algorithm derives a different account from the same seed." },
  },
  {
    id: "m0q3",
    question: { en: "Who pays the reserve for an investor's HBOND trust line?" },
    options: [
      { en: "The investor, who created the line with a non-zero limit" },
      { en: "The issuer, because the line points at it" },
      { en: "Both, 0.1 XAH each" },
    ],
    answer: 0,
    explain: { en: "The account that creates a line with a non-zero limit owns it and locks 0.2 XAH for it." },
  },
  {
    id: "m0q4",
    question: { en: "What does 'validated' mean on Xahau?" },
    options: [
      { en: "Accepted into the open ledger, may still drop out" },
      { en: "Signed and relayed to a majority of peers" },
      { en: "Included in a ledger version the network has validated: final" },
    ],
    answer: 2,
    explain: { en: "Once a ledger including the transaction is validated, it is final." },
  },
  {
    id: "m0q5",
    question: { en: "Why does the course compute 1.15 USD × 100 with dec() instead of plain JavaScript numbers?" },
    options: [
      { en: "dec() is faster" },
      { en: "In floating point 1.15 × 100 is 114.99999999999999, which rounds down to the wrong cent" },
      { en: "The ledger only accepts BigNumber objects" },
    ],
    answer: 1,
    explain: { en: "Binary floating point can't hold most decimal fractions exactly. dec() does exact decimal arithmetic, and rounding is then a deliberate choice." },
  },
]

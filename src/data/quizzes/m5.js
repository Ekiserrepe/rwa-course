/**
 * Module 5: Servicing.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m5q1",
    question: { en: "Why does the holder snapshot pin one validated ledger index?" },
    options: [
      { en: "account_lines requires it" },
      { en: "So every page of results describes the same moment" },
      { en: "To avoid paying for the request" },
    ],
    answer: 1,
    explain: { en: "Paging through a moving ledger could count a holder twice or miss one." },
  },
  {
    id: "m5q2",
    question: { en: "The coupon script crashes right after submitting BOB's payment. On the rerun, account_tx doesn't show it yet. What does the script do?" },
    options: [
      { en: "Checks its journal: if the payment's LastLedgerSequence hasn't passed, it leaves BOB alone until it settles" },
      { en: "Pays BOB again: the history is the only record" },
      { en: "Skips everyone and stops" },
    ],
    answer: 0,
    explain: { en: "account_tx shows only validated transactions. The journal written before sending covers payments in flight." },
  },
  {
    id: "m5q3",
    question: { en: "A holder returns tokens to the issuer, then the treasury's principal payment fails with tecPATH_PARTIAL. What is the problem?" },
    options: [
      { en: "The tokens weren't destroyed" },
      { en: "The fee was too low" },
      { en: "Two transactions aren't atomic: the holder gave up the bonds and received nothing" },
    ],
    answer: 2,
    explain: { en: "That is why redemption uses one DEX trade, delivery versus payment." },
  },
  {
    id: "m5q4",
    question: { en: "What does 44-redemption-window.js do before posting its bid?" },
    options: [
      { en: "Checks NAV is fresh" },
      { en: "Cancels the treasury's unsold primary offer and checks the unlocked USD covers the whole principal" },
      { en: "Freezes every holder" },
    ],
    answer: 1,
    explain: { en: "The bid would cross the treasury's own primary offer, so it is cancelled explicitly; and an unfunded window is refused." },
  },
  {
    id: "m5q5",
    question: { en: "479 HBOND at 1.15 USD each. What coupon does the script pay?" },
    options: [
      { en: "550.85 USD" },
      { en: "550.84 USD" },
      { en: "550.9 USD" },
    ],
    answer: 0,
    explain: { en: "479 × 1.15 is exactly 550.85. A floating-point floor would give 550.84." },
  },
]

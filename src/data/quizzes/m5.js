/**
 * Module 5: Servicing.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m5q1",
    question: { en: "Why does the holder snapshot pin one ledger index?" },
    options: [
      { en: "So every page of account_lines describes the same moment" },
      { en: "To make it cheaper" },
      { en: "Because account_lines needs it" },
    ],
    answer: 0,
    explain: { en: "Between page requests holdings can change; a pinned ledger is a consistent record date." },
  },
  {
    id: "m5q2",
    question: { en: "How does 41-pay-coupon.js avoid paying someone twice after a crash?" },
    options: [
      { en: "It tags payments with the record ledger in a memo and skips holders already tagged in account_tx" },
      { en: "A local file of paid holders" },
      { en: "It can't" },
    ],
    answer: 0,
    explain: { en: "The ledger itself is the log, so there's no local state to lose." },
  },
  {
    id: "m5q3",
    question: { en: "The first redemption design returned tokens, then paid principal separately. What went wrong?" },
    options: [
      { en: "The tokens weren't destroyed" },
      { en: "The fee was too high" },
      { en: "The second payment failed and the holder was left with nothing" },
    ],
    answer: 2,
    explain: { en: "Two payments aren't atomic. The redemption window does it in one DEX trade." },
  },
  {
    id: "m5q4",
    question: { en: "What does 44-redemption-window.js check before posting its bid?" },
    options: [
      { en: "That NAV is fresh" },
      { en: "That the market is open" },
      { en: "That the treasury holds enough USD for the whole outstanding supply" },
    ],
    answer: 2,
    explain: { en: "It refuses to post a redemption promise the treasury can't fund." },
  },
]

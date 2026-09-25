/**
 * Module 10: Capstone.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m10q1",
    question: { en: "How does the capstone create seven accounts without waiting for the faucet?" },
    options: [
      { en: "It pays 40 XAH to each freshly generated address from an existing account" },
      { en: "It reuses the course accounts" },
      { en: "Accounts don't need XAH" },
    ],
    answer: 0,
    explain: { en: "A payment to a new address creates the account immediately." },
  },
  {
    id: "m10q2",
    question: { en: "Why did the first capstone run stop at maturity?" },
    options: [
      { en: "A bug in the redemption window" },
      { en: "The desk Hook blocked it" },
      { en: "The treasury had spent part of the raised money on coupons and couldn't cover principal" },
    ],
    answer: 2,
    explain: { en: "Principal comes from the asset's sale or refinancing; the check refused an unfunded window." },
  },
  {
    id: "m10q3",
    question: { en: "In the incident, what can't the issuer recover for Dave?" },
    options: [
      { en: "The USD in his lost account" },
      { en: "His bonds" },
      { en: "His KYC approval" },
    ],
    answer: 0,
    explain: { en: "The issuer can claw back and re-issue its own token, not someone else's stablecoin." },
  },
]

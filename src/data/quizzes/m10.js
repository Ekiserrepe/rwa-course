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
      { en: "It creates them with Import" },
    ],
    answer: 0,
    explain: { en: "A payment of enough XAH to a new address creates the account." },
  },
  {
    id: "m10q2",
    question: { en: "At maturity, why does the capstone fund the treasury before opening the redemption window?" },
    options: [
      { en: "The DEX requires a deposit" },
      { en: "To pay the Hook's fees" },
      { en: "The money raised was spent on the asset and coupons; the principal comes from selling it" },
    ],
    answer: 2,
    explain: { en: "A redemption window the treasury can't honour must never open." },
  },
  {
    id: "m10q3",
    question: { en: "In the incident, what can't the issuer recover for Dave?" },
    options: [
      { en: "His bonds" },
      { en: "The USD in his lost account" },
      { en: "His KYC approval" },
    ],
    answer: 1,
    explain: { en: "Clawback reaches the issuer's own token. Cash issued by someone else is out of its reach." },
  },
]

/**
 * Module 7: Oracles.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m7q1",
    question: { en: "What time format does OracleSet's LastUpdateTime use?" },
    options: [
      { en: "Unix time" },
      { en: "Ledger time (since 2000)" },
      { en: "Ledger index" },
    ],
    answer: 0,
    explain: { en: "Unlike escrow times, oracle update times are Unix time and must be close to the ledger's clock." },
  },
  {
    id: "m7q2",
    question: { en: "How is a NAV of 100.37 published?" },
    options: [
      { en: "AssetPrice 100.37" },
      { en: "AssetPrice 10037 (as hex) with Scale 2" },
      { en: "AssetPrice 10037 with Scale -2" },
    ],
    answer: 1,
    explain: { en: "Prices are integers with a scale; AssetPrice is a hex string." },
  },
  {
    id: "m7q3",
    question: { en: "What should code that uses a published price check first?" },
    options: [
      { en: "Only the value" },
      { en: "The publisher's address and the update time" },
      { en: "The Provider text" },
    ],
    answer: 1,
    explain: { en: "Pin who published it and refuse stale data before using the number." },
  },
]

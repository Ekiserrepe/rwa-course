/**
 * Module 7: Oracles.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m7q1",
    question: { en: "What time does OracleSet's LastUpdateTime carry, and how close must it be?" },
    options: [
      { en: "Unix time, within 300 seconds of the ledger's close time" },
      { en: "Ledger time, within one hour" },
      { en: "Unix time, any value after the previous update" },
    ],
    answer: 0,
    explain: { en: "It is Unix time and must be within 300 s of the close time (and later than the previous update), or tecINVALID_UPDATE_TIME." },
  },
  {
    id: "m7q2",
    question: { en: "How is a NAV of 100.37 published?" },
    options: [
      { en: "AssetPrice \"100.37\"" },
      { en: "AssetPrice 10037 with Scale -2" },
      { en: "AssetPrice 10037 (as hex) with Scale 2" },
    ],
    answer: 2,
    explain: { en: "Prices are integers with a scale." },
  },
  {
    id: "m7q3",
    question: { en: "A second oracle publishes HBOND/USD at 120. Why can't your code trust it just because the codes match?" },
    options: [
      { en: "Its Provider text is different" },
      { en: "PriceData codes carry no issuer: only the publisher's address binds a price to your token" },
      { en: "Oracles can only have one publisher" },
    ],
    answer: 1,
    explain: { en: "Anyone can publish a price for a code named HBOND. Pin the publisher address and document ID." },
  },
]

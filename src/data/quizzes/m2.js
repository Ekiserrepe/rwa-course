/**
 * Module 2: Issuing.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m2q1",
    question: { en: "On Xahau, which AccountSet flag enables trust line clawback?" },
    options: [
      { en: "16" },
      { en: "7" },
      { en: "17" },
    ],
    answer: 2,
    explain: { en: "17 on Xahau. 16 is asfDisallowIncomingRemit here, unlike on the XRP Ledger." },
  },
  {
    id: "m2q2",
    question: { en: "The issuer already has one trust line and tries to enable clawback. Result?" },
    options: [
      { en: "tesSUCCESS" },
      { en: "tecNO_PERMISSION" },
      { en: "tecOWNERS" },
    ],
    answer: 2,
    explain: { en: "Clawback (and RequireAuth) can only be enabled while the issuer owns no ledger objects, trust lines included." },
  },
  {
    id: "m2q3",
    question: { en: "How does an issuer create new tokens?" },
    options: [
      { en: "URITokenMint" },
      { en: "AccountSet with a supply field" },
      { en: "By paying them to someone" },
    ],
    answer: 2,
    explain: { en: "Issuing is a Payment from the issuer; paying tokens back to the issuer destroys them." },
  },
  {
    id: "m2q4",
    question: { en: "How is the currency code HBOND written on the ledger?" },
    options: [
      { en: "As \"HBOND\"" },
      { en: "As 40 hex characters, name bytes first, zero padded" },
      { en: "As base64" },
    ],
    answer: 1,
    explain: { en: "Only three-character codes are written as-is; longer names become a 40-hex code." },
  },
  {
    id: "m2q5",
    question: { en: "What does gateway_balances report as obligations when the treasury is named as hotwallet?" },
    options: [
      { en: "Tokens held by the treasury" },
      { en: "The issuer's XAH" },
      { en: "Tokens held outside the treasury" },
    ],
    answer: 2,
    explain: { en: "Hot wallets are reported separately under balances; obligations are what everyone else holds." },
  },
]

/**
 * Module 2: Issuing.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m2q1",
    question: { en: "On Xahau, which AccountSet flag enables trust line clawback?" },
    options: [
      { en: "16, as on the XRP Ledger" },
      { en: "17" },
      { en: "8" },
    ],
    answer: 1,
    explain: { en: "Xahau numbers it 17. 16 is a different flag on Xahau, and 8 is DefaultRipple." },
  },
  {
    id: "m2q2",
    question: { en: "The issuer publishes a NAV oracle, then tries to enable clawback. Nobody has a trust line yet. Result?" },
    options: [
      { en: "tecOWNERS: the oracle is in the issuer's owner directory, which must be empty" },
      { en: "tesSUCCESS: only trust lines block it" },
      { en: "tecNO_PERMISSION" },
    ],
    answer: 0,
    explain: { en: "RequireAuth and clawback need an empty owner directory: no trust line and no object of the issuer's own. 10-issuer-setup.js checks account_objects, not just account_lines." },
  },
  {
    id: "m2q3",
    question: { en: "How does an issuer create new HBOND?" },
    options: [
      { en: "An AccountSet that raises the supply" },
      { en: "A URITokenMint" },
      { en: "A Payment of HBOND from the issuer to a holder" },
    ],
    answer: 2,
    explain: { en: "Issued tokens come into existence when their issuer pays them, and stop existing when paid back to it." },
  },
  {
    id: "m2q4",
    question: { en: "How is the currency code HBOND written on the ledger?" },
    options: [
      { en: "\"HBOND\", like USD" },
      { en: "As 40 hex characters: the name's bytes, zero padded" },
      { en: "As its SHA-256 hash" },
    ],
    answer: 1,
    explain: { en: "Only three-character codes are written as text. Longer names become 20 bytes of hex." },
  },
  {
    id: "m2q5",
    question: { en: "gateway_balances is called with the treasury as hotwallet. What are the obligations?" },
    options: [
      { en: "HBOND held outside the treasury, by investors" },
      { en: "All HBOND ever issued" },
      { en: "HBOND held by the treasury" },
    ],
    answer: 0,
    explain: { en: "Naming the treasury as a hot wallet separates the unsold supply from what investors hold." },
  },
]

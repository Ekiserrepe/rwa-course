/**
 * Module 3: Compliance.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m3q1",
    question: { en: "CAROL has a trust line the issuer never authorised. The treasury pays her 10 HBOND. Result?" },
    options: [
      { en: "tesSUCCESS, and her line is authorised automatically" },
      { en: "The payment waits for the issuer's approval" },
      { en: "tecPATH_DRY: an unauthorised line can't hold the token" },
    ],
    answer: 2,
    explain: { en: "With RequireAuth, tokens can't reach a line the issuer hasn't approved." },
  },
  {
    id: "m3q2",
    question: { en: "ALICE is under a regular freeze. Which still works?" },
    options: [
      { en: "ALICE sends HBOND to BOB" },
      { en: "BOB sends HBOND to ALICE" },
      { en: "ALICE sells HBOND on the DEX" },
    ],
    answer: 1,
    explain: { en: "A regular freeze stops the holder getting rid of the token, not receiving it. A deep freeze stops receiving too." },
  },
  {
    id: "m3q3",
    question: { en: "At maturity, a deep-frozen holder wants to redeem. What works?" },
    options: [
      { en: "Returning the tokens to the issuer, or being paid and clawed back by the issuer" },
      { en: "Selling into the redemption window, like everyone else" },
      { en: "Nothing until the freeze is lifted" },
    ],
    answer: 0,
    explain: { en: "Every freeze leaves the issuer path open. The DEX isn't: a frozen holder's sell offers count as unfunded." },
  },
  {
    id: "m3q4",
    question: { en: "In a Clawback transaction, what goes in Amount.issuer?" },
    options: [
      { en: "The token's issuer" },
      { en: "The treasury" },
      { en: "The holder to claw back from" },
    ],
    answer: 2,
    explain: { en: "Clawback's Amount names the holder in the issuer field; the issuer is the account sending the transaction." },
  },
  {
    id: "m3q5",
    question: { en: "You want no stranger to open objects against your treasury. Which account should NOT get asfDisallowIncomingTrustline?" },
    options: [
      { en: "The treasury" },
      { en: "The issuer: every investor's line is an incoming trust line to it" },
      { en: "A vault" },
    ],
    answer: 1,
    explain: { en: "On the issuer that flag would stop investors requesting lines at all. RequireAuth already keeps unapproved lines empty." },
  },
]

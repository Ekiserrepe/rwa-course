/**
 * Module 4: Markets.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m4q1",
    question: { en: "In the treasury's primary OfferCreate, what is TakerGets?" },
    options: [
      { en: "What the treasury gives: the HBOND" },
      { en: "What the treasury wants: the USD" },
      { en: "The price per unit" },
    ],
    answer: 0,
    explain: { en: "TakerGets is what the taker of the offer gets, so what the offer's owner gives." },
  },
  {
    id: "m4q2",
    question: { en: "An investor without KYC approval places an order to buy HBOND. Result?" },
    options: [
      { en: "It rests on the book until approval" },
      { en: "It fills, and the issuer freezes the line afterwards" },
      { en: "tecNO_AUTH: the ledger won't let the order put HBOND on an unapproved line" },
    ],
    answer: 2,
    explain: { en: "RequireAuth applies at the exchange too." },
  },
  {
    id: "m4q3",
    question: { en: "ALICE's Fill or Kill buy has a price cap just under the book price. Result?" },
    options: [
      { en: "It fills the part it can at her cap" },
      { en: "tecKILLED: nothing moves" },
      { en: "It fills at the book price anyway" },
    ],
    answer: 1,
    explain: { en: "Fill or Kill takes the whole amount within the limit, or nothing." },
  },
  {
    id: "m4q4",
    question: { en: "A \"send USD to this address\" desk delivers HBOND with an emitted payment. How does it compare with a DEX sale?" },
    options: [
      { en: "It is two steps: the desk checks before accepting and refunds if delivery fails, but the swap isn't one transaction" },
      { en: "It is equally atomic" },
      { en: "It is atomic only with Fill or Kill" },
    ],
    answer: 0,
    explain: { en: "A DEX trade swaps both sides in one transaction. The desk makes the two-step flow safe with checks and a refund." },
  },
]

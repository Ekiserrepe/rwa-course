/**
 * Module 4: Markets.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m4q1",
    question: { en: "In the treasury's OfferCreate, what is TakerGets?" },
    options: [
      { en: "What the treasury gives" },
      { en: "What the treasury wants" },
      { en: "The fee" },
    ],
    answer: 0,
    explain: { en: "The taker is whoever takes the offer later: TakerGets is what the offer's owner gives." },
  },
  {
    id: "m4q2",
    question: { en: "An investor without KYC approval places an order to buy HBOND. Result?" },
    options: [
      { en: "It rests on the book" },
      { en: "tecNO_AUTH" },
      { en: "It fills at a discount" },
    ],
    answer: 1,
    explain: { en: "The DEX refuses unapproved accounts, even as a resting order." },
  },
  {
    id: "m4q3",
    question: { en: "Alice's Fill or Kill buy has a price cap under the book price. Result?" },
    options: [
      { en: "It fills partially" },
      { en: "It fills at the book price anyway" },
      { en: "tecKILLED, nothing moves" },
    ],
    answer: 2,
    explain: { en: "Fill or Kill fills completely or not at all." },
  },
  {
    id: "m4q4",
    question: { en: "Why is a DEX sale called delivery versus payment?" },
    options: [
      { en: "Delivery happens first, payment later" },
      { en: "A broker guarantees it" },
      { en: "Asset and payment swap in the same transaction, or nothing happens" },
    ],
    answer: 2,
    explain: { en: "One transaction moves both sides, so nobody can be left having paid without receiving." },
  },
]

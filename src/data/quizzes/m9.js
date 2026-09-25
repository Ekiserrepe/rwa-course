/**
 * Module 9: Hooks.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m9q1",
    question: { en: "ALICE pays HBOND to BOB. The issuer has a Hook that refuses everything. Result?" },
    options: [
      { en: "tesSUCCESS: the issuer is only a weak stakeholder" },
      { en: "tecHOOK_REJECTED" },
      { en: "The payment waits for approval" },
    ],
    answer: 0,
    explain: { en: "The issuer's Hook isn't asked (or runs afterwards with a collect call); the payment succeeds." },
  },
  {
    id: "m9q2",
    question: { en: "Why does the subscription desk refuse partial payments?" },
    options: [
      { en: "They are slower" },
      { en: "Their Amount is only a maximum, so the desk could over-deliver" },
      { en: "Hooks can't read them" },
    ],
    answer: 1,
    explain: { en: "With tfPartialPayment, less than Amount may arrive." },
  },
  {
    id: "m9q3",
    question: { en: "How does holding_cap enforce its limit?" },
    options: [
      { en: "After the transfer, it emits a TrustSet that freezes the receiver" },
      { en: "It blocks the transfer" },
      { en: "It claws back automatically" },
    ],
    answer: 0,
    explain: { en: "It's reactive: a weak execution that emits a freeze." },
  },
  {
    id: "m9q4",
    question: { en: "Why did the first holding_cap build fail with EMISSION_FAILURE?" },
    options: [
      { en: "TrustSet can't be emitted" },
      { en: "The Hook had no HookOn" },
      { en: "etxn_details needs a buffer of at least 116 bytes and got 115" },
    ],
    answer: 2,
    explain: { en: "xahaud's etxn_details refuses buffers shorter than 116 bytes (138 with a callback)." },
  },
]

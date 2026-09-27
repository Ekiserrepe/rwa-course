/**
 * Module 9: Hooks.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m9q1",
    question: { en: "ALICE pays HBOND to BOB. The issuer has a Hook that refuses everything, without a collect call. Result?" },
    options: [
      { en: "tecHOOK_REJECTED" },
      { en: "The payment waits for the issuer" },
      { en: "tesSUCCESS: the issuer is only a weak stakeholder and its Hook isn't asked" },
    ],
    answer: 2,
    explain: { en: "Weak stakeholders run only with a collect call, and even then after the transaction, unable to refuse it." },
  },
  {
    id: "m9q2",
    question: { en: "The desk accepted ALICE's USD, but its HBOND delivery failed a ledger later. What happens?" },
    options: [
      { en: "ALICE loses the USD" },
      { en: "The desk's cbak sees the failed result and emits a refund" },
      { en: "The treasury must refund her by hand" },
    ],
    answer: 1,
    explain: { en: "cbak runs once the emitted payment settles; meta_slot gives its result." },
  },
  {
    id: "m9q3",
    question: { en: "BOB pays ALICE with Amount.issuer set to ALICE. How does holding_cap still catch it?" },
    options: [
      { en: "It reads the metadata: ALICE's HBOND line went up" },
      { en: "It checks Amount.issuer" },
      { en: "It can't; that route bypasses it" },
    ],
    answer: 0,
    explain: { en: "Reading the balance changes covers every route: payments, checks, Remit, resting bids." },
  },
  {
    id: "m9q4",
    question: { en: "Why does the lockbox keep a lock after emitting its release payment?" },
    options: [
      { en: "To allow a second release" },
      { en: "Hook state can't be deleted in hook()" },
      { en: "The payment can still fail; cbak deletes the lock only once it's delivered" },
    ],
    answer: 2,
    explain: { en: "If the lock were deleted on emit, a failed payment would strand the tokens in the vault." },
  },
  {
    id: "m9q5",
    question: { en: "Why is the lockbox installed with HookOn set to every type?" },
    options: [
      { en: "It's cheaper" },
      { en: "A list always misses some route, such as a Remit or a URIToken purchase paid in HBOND" },
      { en: "Invoke requires it" },
    ],
    answer: 1,
    explain: { en: "With every type, the vault's own transactions are refused unless emitted, XAH-only or key management." },
  },
]

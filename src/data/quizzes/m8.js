/**
 * Module 8: Keys and governance.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m8q1",
    question: { en: "Do the three officers in the 2-of-3 signer list need funded accounts?" },
    options: [
      { en: "Yes, 1 XAH each for the reserve" },
      { en: "No: signers are key pairs listed on the issuer and pay nothing" },
      { en: "Only the one who submits" },
    ],
    answer: 1,
    explain: { en: "Signer entries are addresses; they never pay fees or reserves." },
  },
  {
    id: "m8q2",
    question: { en: "What does wallet.sign(tx, true) produce?" },
    options: [
      { en: "One signer's signature for a multisigned transaction" },
      { en: "A signature ready to submit alone" },
      { en: "A signature with the master key only" },
    ],
    answer: 0,
    explain: { en: "Multisigning collects several such signatures and combines them." },
  },
  {
    id: "m8q3",
    question: { en: "When should the issuer disable its master key?" },
    options: [
      { en: "Before installing the signer list, to be safe" },
      { en: "Never on an issuer" },
      { en: "After the signer list is installed and tested with a real action" },
    ],
    answer: 2,
    explain: { en: "Disable it only once another way to sign is proven, or the account locks itself out." },
  },
]

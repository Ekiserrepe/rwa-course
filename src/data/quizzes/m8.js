/**
 * Module 8: Governance.
 * Every question is answerable from this module's own lesson text.
 */

export default [
  {
    id: "m8q1",
    question: { en: "Do the three officers in the 2-of-3 signer list need funded accounts?" },
    options: [
      { en: "Yes, 1 XAH each" },
      { en: "No: signers are key pairs listed on the issuer and pay nothing" },
      { en: "Only the first one" },
    ],
    answer: 1,
    explain: { en: "A signer never pays fees or reserves." },
  },
  {
    id: "m8q2",
    question: { en: "What does sign(tx, true) do?" },
    options: [
      { en: "Signs and submits" },
      { en: "Signs as one signer of a multisig" },
      { en: "Signs with the master key" },
    ],
    answer: 1,
    explain: { en: "Each officer signs the same prepared transaction; multisign() combines the blobs." },
  },
  {
    id: "m8q3",
    question: { en: "When should the issuer disable its master key?" },
    options: [
      { en: "Before installing the signer list" },
      { en: "After the signer list is installed and tested with a real action" },
      { en: "Never" },
    ],
    answer: 1,
    explain: { en: "Disabling it with an untested or lost signer list locks the issuer out." },
  },
]

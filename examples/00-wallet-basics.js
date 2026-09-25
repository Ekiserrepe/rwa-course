// 00-wallet-basics.js: what an account really is, in four steps
//   node 00-wallet-basics.js
//
// 1. Create a key pair OFFLINE: no network, no permission, just maths
// 2. Ask the testnet faucet to send XAH to it: that creates the account
// 3. Read the account back from the ledger
// 4. Work out how much of the balance you can actually spend
const { Wallet, dropsToXah } = require("xahau");
const { connect } = require("./lib/xahau");

async function main() {
  // 1. A wallet is just a key pair. Nothing is on the ledger yet.
  const w = Wallet.generate();
  console.log("Address (share it freely):", w.classicAddress);
  console.log("Public key (safe to share):", w.publicKey);
  console.log("Seed (NEVER share it):     ", w.seed, "  <- whoever has this controls the account\n");

  // 2. An account exists only once it holds the base reserve. The testnet
  //    faucet sends free test XAH to any address you give it.
  for (;;) {
    const res = await fetch("https://xahau-test.net/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destination: w.classicAddress }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && !body.error) break;
    // The faucet serves about one request a minute: wait and try again
    console.log("Faucet busy:", body.error ?? res.status);
    await new Promise((r) => setTimeout(r, 15_000));
  }
  console.log("Faucet funded the address. Waiting for the next ledger…");
  await new Promise((r) => setTimeout(r, 8000));

  // 3. Read it: account_info returns the AccountRoot, the account's own ledger object
  const client = await connect();
  const info = (await client.request({ command: "account_info", account: w.classicAddress, ledger_index: "validated" })).result.account_data;
  const server = (await client.request({ command: "server_info" })).result.info.validated_ledger;
  await client.disconnect();

  // 4. Part of the balance is locked as reserve and cannot be spent
  const balance = Number(dropsToXah(info.Balance));
  const locked = server.reserve_base_xrp + info.OwnerCount * server.reserve_inc_xrp;
  console.log(`Balance:     ${balance} XAH (${info.Balance} drops)`);
  console.log(`Objects:     ${info.OwnerCount} (each locks ${server.reserve_inc_xrp} XAH)`);
  console.log(`Locked:      ${locked} XAH = ${server.reserve_base_xrp} base reserve + objects`);
  console.log(`Spendable:   ${balance - locked} XAH`);
  console.log(`Sequence:    ${info.Sequence} (the number the account's next transaction must carry)`);
}

main().catch((err) => {
  console.error("✘", err.message);
  process.exit(1);
});

# Hooks for an RWA issuer

| File | What it is |
|---|---|
| `probe.c` / `.wasm` | Refuses everything except the account's own transactions. Used to show who a Hook is asked about |
| `who-sees-what.js` | Installs the probe on the ISSUER, sends HBOND holder→holder and holder→issuer, removes it |
| `subscription_desk.c` / `.wasm` | On the TREASURY: pay USD, receive HBOND at a fixed price. Refuses other currencies, partial payments, unapproved buyers, oversubscription |
| `prepare-subscriber.js` | Give any role what the desk requires: USD and an authorised HBOND trust line (`--no-kyc` leaves it unapproved) |
| `install-subscription-desk.js` · `subscribe-via-desk.js` | Install/remove it; subscribe as a role |
| `holding_cap.c` / `.wasm` | On the ISSUER, collect call: after a transfer, freezes a receiver above `MAX` |
| `install-holding-cap.js` | Install/remove it |
| `lockbox.c` / `.wasm` | On a dedicated VAULT: time locks for HBOND (which can't be escrowed, its issuer has clawback), released by an Invoke after their date; the issuer can still claw back |
| `install-lockbox.js` · `lock-tokens.js` · `release-lock.js` | Create the vault and install/remove it; lock tokens for a beneficiary; release or (issuer) void a lock |
| `lib.js` | `install`, `remove` and parameter encoders shared by the installers |
| `build.sh` | Compile a `.c` into a cleaned `.wasm` |
| `include/` | The official Hooks API headers |

## Building

The `.wasm` files are committed, so the lessons run without building. To rebuild:

```sh
sh hooks/build.sh subscription_desk
```

`build.sh` needs a clang (LLVM) that can target `wasm32` and
[hook-cleaner](https://github.com/XRPLF/hook-cleaner-c), on your `PATH` or named in
`CLANG` and `HOOK_CLEANER`. It checks both and says what is missing.

Without a local toolchain, compile with the [Hooks Builder](https://builder.xahau.network/)
(in the browser) or the [Hooks CLI](https://github.com/Xahau/hooks-cli). Lesson 9.5 lists
these and the [Hooks Toolkit](https://hooks-toolkit.com/).

`-mcpu=mvp` matters: xahaud rejects post-MVP WebAssembly features that newer clang
emits by default.

# Hooks for an RWA issuer

| File | What it is |
|---|---|
| `probe.c` / `.wasm` | Refuses everything except the account's own transactions. Used to show who a Hook is asked about |
| `who-sees-what.js` | Installs the probe on the ISSUER, sends HBOND holder→holder and holder→issuer, removes it |
| `subscription_desk.c` / `.wasm` | On the TREASURY: pay USD, receive HBOND at a fixed price. Refuses other currencies, partial payments, unapproved buyers, oversubscription |
| `install-subscription-desk.js` · `subscribe-via-desk.js` | Install/remove it; subscribe as a role |
| `holding_cap.c` / `.wasm` | On the ISSUER, collect call: after a transfer, freezes a receiver above `MAX` |
| `install-holding-cap.js` | Install/remove it |
| `lib.js` | `install`, `remove` and parameter encoders shared by the installers |
| `build.sh` | Compile a `.c` into a cleaned `.wasm` |
| `include/` | The official Hooks API headers |

## Building

The `.wasm` files are committed, so the lessons run without building. To rebuild:

```sh
brew install llvm            # Apple's clang can't target wasm
# hook-cleaner: https://github.com/RichardAH/hook-cleaner-c, on your PATH or in HOOK_CLEANER
sh hooks/build.sh subscription_desk
```

Or paste the C file into the [Hooks Builder](https://builder.xahau.network).

`-mcpu=mvp` matters: xahaud rejects post-MVP WebAssembly features that newer clang
emits by default.

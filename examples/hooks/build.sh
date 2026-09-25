#!/bin/sh
# build.sh: compile a Hook written in C into the .wasm that SetHook installs
#   sh hooks/build.sh subscription_desk
#
# Needs a wasm-capable clang (Apple's cannot target wasm: `brew install llvm`)
# and hook-cleaner (https://github.com/RichardAH/hook-cleaner-c) on your PATH,
# or point CLANG / HOOK_CLEANER at them.
set -e
cd "$(dirname "$0")"
NAME="$1"
CLANG="${CLANG:-/opt/homebrew/opt/llvm/bin/clang}"
HOOK_CLEANER="${HOOK_CLEANER:-hook-cleaner}"
# -mcpu=mvp: xahaud rejects the post-MVP WebAssembly features newer clang emits
"$CLANG" --target=wasm32-unknown-unknown -mcpu=mvp -O2 -Wall -Wno-int-conversion \
  -nostdlib -ffreestanding -fno-builtin -Iinclude \
  -Wl,--no-entry -Wl,--allow-undefined -Wl,--export=hook \
  -o "$NAME.raw.wasm" "$NAME.c"
"$HOOK_CLEANER" "$NAME.raw.wasm" "$NAME.wasm" > /dev/null 2>&1
rm "$NAME.raw.wasm"
echo "built hooks/$NAME.wasm ($(wc -c < "$NAME.wasm" | tr -d ' ') bytes)"

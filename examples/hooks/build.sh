#!/bin/sh
# build.sh: compile a Hook written in C into the .wasm that SetHook installs
#   sh hooks/build.sh subscription_desk
#
# Exports hook() and, when the source defines one, cbak() (the callback).
#
# Needs two tools, on your PATH or named in CLANG / HOOK_CLEANER:
#   - a clang (LLVM) that can target wasm32
#   - hook-cleaner (https://github.com/XRPLF/hook-cleaner-c)
#   CLANG=/path/to/clang HOOK_CLEANER=/path/to/hook-cleaner sh hooks/build.sh lockbox
# The Hooks Builder (https://builder.xahau.network) and the Hooks CLI
# (https://github.com/Xahau/hooks-cli) can compile a Hook without them.
set -e
cd "$(dirname "$0")"
NAME="$1"
[ -f "$NAME.c" ] || { echo "Usage: sh hooks/build.sh <name>   (compiles hooks/<name>.c)" >&2; exit 1; }
CLANG="${CLANG:-clang}"
HOOK_CLEANER="${HOOK_CLEANER:-hook-cleaner}"
if ! "$CLANG" --print-targets 2>/dev/null | grep -q wasm32; then
  echo "✘ $CLANG can't target wasm32. Install a clang (LLVM) built with the WebAssembly" >&2
  echo "  target and set CLANG to it, or compile with the Hooks Builder or the Hooks CLI." >&2
  exit 1
fi
command -v "$HOOK_CLEANER" > /dev/null 2>&1 || {
  echo "✘ hook-cleaner not found: build https://github.com/XRPLF/hook-cleaner-c and set HOOK_CLEANER to it" >&2
  exit 1
}
# -mcpu=mvp: xahaud rejects the post-MVP WebAssembly features newer clang emits
EXPORTS="-Wl,--export=hook"
grep -q "int64_t cbak(" "$NAME.c" && EXPORTS="$EXPORTS -Wl,--export=cbak"
"$CLANG" --target=wasm32-unknown-unknown -mcpu=mvp -O2 -Wall -Wno-int-conversion \
  -nostdlib -ffreestanding -fno-builtin -Iinclude \
  -Wl,--no-entry -Wl,--allow-undefined $EXPORTS \
  -o "$NAME.raw.wasm" "$NAME.c"
"$HOOK_CLEANER" "$NAME.raw.wasm" "$NAME.wasm" > /dev/null 2>&1
rm "$NAME.raw.wasm"
echo "built hooks/$NAME.wasm ($(wc -c < "$NAME.wasm" | tr -d ' ') bytes)"

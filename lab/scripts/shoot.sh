#!/usr/bin/env bash
# Headless Edge screenshots of scripted app states (dev server must be running on 5199).
# Uses a throwaway profile so no personal browser data is touched.
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
PROFILE="$TEMP/sol-edge-profile"
for sc in "$@"; do
  "$EDGE" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
    --user-data-dir="$PROFILE" --window-size=1440,900 --virtual-time-budget=16000 \
    --screenshot="$(cygpath -w "$PWD/.shots/H_$sc.png")" "http://localhost:5199/?auto=$sc" 2>/dev/null
  echo "$sc done"
done

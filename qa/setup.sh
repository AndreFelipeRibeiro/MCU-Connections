#!/bin/bash
# One-time setup for the QA checks. Needs Node 18+ and npm. Run from anywhere:
#   bash qa/setup.sh
set -e
cd "$(dirname "$0")"
npm install
npx playwright install chromium
mkdir -p shots vendor
# The checks serve these pinned libraries in place of unpkg, so they run
# offline and always test the exact versions index.html loads.
cd vendor
for p in react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0 @supabase/supabase-js@2.112.2; do
  f=$(npm pack "$p" --silent)
  d="x-${f%.tgz}"
  rm -rf "$d" && mkdir -p "$d" && tar -xzf "$f" -C "$d" && rm "$f"
done
echo "QA ready. Full run: bash qa/regress.sh"

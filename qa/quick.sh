#!/bin/bash
# Per-ticket run: the checks that cover the files changed in the working tree
# (qa/checks.json "files"), plus any check named on the command line (the
# ticket's own), run side by side with pre-compiled scripts. For example:
#   bash qa/quick.sh test-promo
# JOBS (default 4) sets how many run at once. Exits non-zero on any failure.
cd "$(dirname "$0")"
exec node run.js --changed "$@"

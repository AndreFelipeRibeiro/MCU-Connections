#!/bin/bash
# Full regression: headless checks across desktop and phone viewports,
# English and Portuguese. Takes about 25 minutes. Under each script name every
# errors field is listed, and all of them should read [] or 0. Lines marked !!
# are failures; the run exits non-zero when there is any.
# Known noise: test-camera's desktopErrors carries one pre-existing console
# warning ("Unable to preventDefault inside passive event listener"), allowed
# below. Its timing-sensitive steps are described in qa/README.md.
cd "$(dirname "$0")"

# Cap each check at 300s. GNU timeout comes with coreutils and is absent on
# macOS: calling it unguarded made every check die with "command not found",
# after which the grep matched nothing, uniq printed nothing, and the whole run
# "passed" in seconds. Fall back to gtimeout, then to perl's alarm.
if command -v timeout >/dev/null 2>&1; then cap(){ timeout "$@"; }
elif command -v gtimeout >/dev/null 2>&1; then cap(){ gtimeout "$@"; }
else cap(){ _s=$1; shift; perl -e 'alarm shift; exec @ARGV or exit 127' "$_s" "$@"; }
fi

# Four checks print JSON indented (JSON.stringify(out, null, 1)), so a non-empty
# errors array spans several lines. The old single-line pattern could not match
# one and fell back to matching zero digits, printing a bare '"desktopErrors": '
# that read as harmlessly as an empty array. Flatten the output before matching,
# and require [] or a real number so nothing unparsed passes unnoticed.
FIELD='"[^"]*[Ee]rrors\?": *\(\[[^]]*\]\|[0-9][0-9]*\)'
NOISE='Unable to preventDefault inside passive event listener'

fail=0
ran=0
run(){
  ran=$((ran + 1))
  echo "=== $1 $2"
  out=$( set -a; eval "$1"; set +a; cap 300 node "$2" 2>&1 ); status=$?
  found=$(printf '%s' "$out" | tr '\n' ' ' | tr -s ' ' | grep -o "$FIELD")
  [ -n "$found" ] && printf '%s\n' "$found" | sort | uniq -c
  [ "$status" -ne 0 ] && { echo "  !! exited $status"; fail=1; }
  [ -z "$found" ] && { echo "  !! no errors field in output"; fail=1; }
  bad=$(printf '%s\n' "$found" | grep -v ': *\(\[\]\|0\)$' | grep -v "$NOISE")
  [ -n "$bad" ] && { printf '%s\n' "$bad" | sed 's/^/  !! /'; fail=1; }
  return 0
}
run "LOC=en-US MODE=all" test-fit.js
run "LOC=pt-BR MODE=watch" test-fit.js
for t in test-ctxfn2 test-panel test-i18n test-dlist test-suggest test-layers test-anim test-cel test-align2 test-about test-welcome test-camera test-v2 test-widetouch test-variant test-nudgeundo test-pickperson test-escpin test-mviewport test-inertia test-portrait test-recastname test-bannerhold test-progress test-release test-urlstate; do
  run X=1 $t.js
done
# Counted, not hardcoded: the summary said "22" for a run of 23 once.
# "Runs", not "checks": test-fit runs twice, once per language, and the two
# can fail independently, so the number here is larger than the script count.
[ "$fail" -eq 0 ] && echo "=== all $ran check runs clean" || echo "=== FAILURES ABOVE"
exit $fail

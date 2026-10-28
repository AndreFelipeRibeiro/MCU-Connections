#!/bin/bash
# Full regression: 14 headless checks across desktop and phone viewports,
# English and Portuguese. Takes about 15 minutes. Each line under a script
# name is an errors array or count: every one should be [] or 0.
# Known noise: test-camera's desktop array shows one pre-existing warning
# ("Unable to preventDefault inside passive event listener").
cd "$(dirname "$0")"
run(){ echo "=== $1 $2"; env $1 timeout 300 node $2 2>&1 | grep -o '"[A-Za-z0-9 -]*[Ee]rrors\?": *\(\[[^]]*\]\|[0-9]*\)' | sort | uniq -c; }
run "LOC=en-US MODE=all" test-fit.js
run "LOC=pt-BR MODE=watch" test-fit.js
for t in test-ctxfn2 test-panel test-i18n test-dlist test-suggest test-layers test-anim test-cel test-align2 test-about test-welcome test-camera test-v2; do
  run X=1 $t.js
done

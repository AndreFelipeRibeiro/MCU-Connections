#!/bin/bash
# Full regression: every check in qa/checks.json "regress" (headless checks
# across desktop and phone viewports, English and Portuguese) plus the
# accessibility scan in both languages, run side by side by qa/run.js.
# Under each script name every errors field is listed, and all of them should
# read [] or 0; the scans say "no violations". Lines marked !! are failures; the
# run exits non-zero when there is any. At the end: the total time and the ten
# slowest checks.
#
#   bash qa/regress.sh            4 at a time (JOBS=4), about 8 minutes
#   JOBS=1 bash qa/regress.sh     one at a time, as before
#   QA_VERBOSE=1 bash qa/regress.sh   also prints the tail of a failing check
#
# Each check gets its own port (PORT) and the app's .jsx files pre-compiled
# with the pinned Babel (qa/precompile.js). The timing-sensitive checks
# ("serial" in checks.json: camera, inertia, animation, wide touch) run
# afterwards, alone, so a busy machine can't make them flaky.
# Known noise: test-camera's desktopErrors carries one pre-existing console
# warning ("Unable to preventDefault inside passive event listener"), allowed
# in run.js. Its timing-sensitive steps are described in qa/README.md.
# Each check is capped at 300s (run.js), as before.
cd "$(dirname "$0")"
exec node run.js --all

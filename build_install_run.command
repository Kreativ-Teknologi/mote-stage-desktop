#!/bin/bash
cd "$(dirname "$0")" || exit 1
/bin/bash ./build_install_run.sh
result=$?
if [ "$result" -ne 0 ]; then
  printf '\nBuild or installation failed. See the message above.\n'
else
  printf '\nMOTE Stage is ready. You can close this Terminal window.\n'
fi
read -r -p 'Press Return to close… ' _mote_reply
exit "$result"

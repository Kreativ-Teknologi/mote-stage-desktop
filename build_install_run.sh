#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [ "$(uname -s)" != "Darwin" ]; then echo 'Run this script on a Mac. Use build_install_run.ps1 on Windows.'; exit 1; fi
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then echo 'Install Node.js 22.12 or newer from https://nodejs.org, then run this script again.'; exit 1; fi
node -e 'if(Number(process.versions.node.split(".")[0])<22 || (Number(process.versions.node.split(".")[0])===22 && Number(process.versions.node.split(".")[1])<12)){console.error("Node.js 22.12 or newer is required.");process.exit(1)}'
echo 'Downloading desktop build tools (first build requires internet)…'
npm ci --no-audit --no-fund
echo 'Building the Mac app and distribution files…'
npm run build:mac
ARCH="$(node -p 'process.arch')"
APP_PATH="release/mac-${ARCH}/MOTE Stage.app"
if [ "$ARCH" = 'x64' ]; then APP_PATH='release/mac/MOTE Stage.app'; fi
if [ ! -d "$APP_PATH" ]; then echo 'Build finished, but the app folder was not found. Check release/.'; exit 1; fi
INSTALL_PATH="$HOME/Applications/MOTE Stage.app"
mkdir -p "$HOME/Applications"
if [ -d "$INSTALL_PATH" ]; then
  if pgrep -f "$INSTALL_PATH/Contents/MacOS/" >/dev/null; then echo 'Close MOTE Stage before installing. Your build is in release/.'; exit 1; fi
  mv "$INSTALL_PATH" "${INSTALL_PATH}.backup-$(date +%Y%m%d-%H%M%S)"
fi
ditto "$APP_PATH" "$INSTALL_PATH"
echo "Installed to $INSTALL_PATH. Starting MOTE Stage…"
open "$INSTALL_PATH"

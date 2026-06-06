#!/usr/bin/env bash
# Quick status — run ONLY on MACBIRD. Uses localhost checks only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
ARTIFACTS="$ROOT/deploy/artifacts"

# shellcheck disable=SC1091
source "$ROOT/deploy/scripts/macbird-common.sh"
macbird_load_nvm

echo "==> PM2"
pm2 list 2>/dev/null || echo "pm2 not running"

echo ""
echo "==> API health (localhost)"
if macbird_local_health; then
  echo "API OK"
else
  echo "API DOWN"
fi

if [ -f "$ARTIFACTS/api_public_url.txt" ]; then
  echo ""
  echo "==> Public API URL (from last deploy log)"
  tr -d '\r\n' < "$ARTIFACTS/api_public_url.txt"
  echo
fi

if [ -f "$ARTIFACTS/deploy-summary.txt" ]; then
  echo ""
  echo "==> Last deploy summary"
  cat "$ARTIFACTS/deploy-summary.txt"
fi

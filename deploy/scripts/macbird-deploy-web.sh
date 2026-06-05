#!/usr/bin/env bash
# Run ONLY on MACBIRD.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
ARTIFACTS="$ROOT/deploy/artifacts"
API_URL_FILE="$ARTIFACTS/api_public_url.txt"

if [ ! -f "$API_URL_FILE" ]; then
  echo "ERROR: missing $API_URL_FILE — run macbird-run-api.sh first"
  exit 1
fi

API_URL="$(tr -d '\r\n' < "$API_URL_FILE")"
export VITE_API_URL="${API_URL}/api"

# shellcheck disable=SC1091
source "$ROOT/deploy/scripts/macbird-common.sh"
macbird_load_nvm

echo "==> Building web with VITE_API_URL=$VITE_API_URL"
npm run build -w packages/shared
npm run build -w apps/web

WEB_DIR="$ARTIFACTS/web-package"
rm -rf "$WEB_DIR" "$ARTIFACTS/web.zip"
mkdir -p "$WEB_DIR"
cp deploy/squarecloud/web/squarecloud.app "$WEB_DIR/"
cp deploy/squarecloud/web/package.json "$WEB_DIR/"
cp -r apps/web/dist/. "$WEB_DIR/"
command -v zip >/dev/null || sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zip
(cd "$WEB_DIR" && zip -r "$ARTIFACTS/web.zip" . >/dev/null)

echo "==> Commit web to Square Cloud"
squarecloud app commit 64b24ebc1cec4170aba20aeb5cf25af1 --file deploy/artifacts/web.zip --restart

sleep 10
if [ "${SKIP_WEB_CHECK:-0}" != "1" ]; then
  curl -sS --max-time 15 -o /dev/null -w "web:%{http_code}\n" https://iptv-manager.squareweb.app/
fi

cat > "$ARTIFACTS/deploy-summary.txt" <<SUMMARY
Deploy finished (MACBIRD API + Square Web).
Web: https://iptv-manager.squareweb.app
API: ${API_URL}
VITE_API_URL: ${VITE_API_URL}
SUMMARY
cat "$ARTIFACTS/deploy-summary.txt"

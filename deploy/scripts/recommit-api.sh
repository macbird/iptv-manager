#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
WORKDIR="$ROOT/deploy/artifacts"
API_DIR="$WORKDIR/api-package"
rm -rf "$API_DIR" "$WORKDIR/api.zip"
mkdir -p "$API_DIR"
cp deploy/squarecloud/api/squarecloud.app "$API_DIR/"
cp package.json package-lock.json "$API_DIR/" 2>/dev/null || cp package.json "$API_DIR/"
cp -r packages "$API_DIR/"
mkdir -p "$API_DIR/apps"
cp -r apps/api "$API_DIR/apps/api"
DATABASE_URL_PUBLIC="$(cat deploy/artifacts/database_url_public.txt)"
cat > "$API_DIR/.env" <<EOF
DATABASE_URL=${DATABASE_URL_PUBLIC}?schema=public
JWT_SECRET=supersecretjwtkey
CREDENTIALS_ENCRYPTION_KEY=supersecretjwtkey
API_PUBLIC_BASE_URL=https://iptv-manager-api.squareweb.app
EOF
(cd "$API_DIR" && zip -r "$WORKDIR/api.zip" . >/dev/null)
squarecloud app commit 761ce7863dd64c8eb92f9c7b176d74a9 --file deploy/artifacts/api.zip --restart

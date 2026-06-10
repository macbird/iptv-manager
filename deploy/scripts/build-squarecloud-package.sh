#!/usr/bin/env bash
# Builds a slim Square Cloud zip (dist + package files, NO node_modules).
# Dependencies install on app boot via start-prod.sh when deploy SHA changes.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PKG_DIR="${ROOT_DIR}/deploy/artifacts/pixflow-prebuilt-pkg"
ZIP="${ROOT_DIR}/deploy/artifacts/pixflow-prebuilt.zip"
MAX_ZIP_BYTES=$((25 * 1024 * 1024))

require_file() {
  local path="$1"
  local label="$2"
  if [ -z "${path}" ] || [ ! -e "${path}" ]; then
    echo "::error::Missing ${label}: ${path}" >&2
    exit 1
  fi
}

echo "==> Validating build outputs"
require_file client.p12 "client.p12"
require_file start-prod.sh "start-prod.sh"
require_file squarecloud.app "squarecloud.app"
require_file package.json "package.json"
require_file apps/api/dist/main.js "API dist"
require_file apps/web/dist/index.html "Web dist"
require_file packages/shared/dist/index.js "Shared dist"

if ! grep -q '^MEMORY=512' squarecloud.app; then
  echo "::error::squarecloud.app must use MEMORY=512" >&2
  exit 1
fi

mkdir -p deploy/artifacts
rm -rf "$PKG_DIR" "$ZIP"
mkdir -p "$PKG_DIR"

echo "==> Copying slim runtime tree (no node_modules)"
cp package.json squarecloud.app start-prod.sh client.p12 "$PKG_DIR/"

mkdir -p "$PKG_DIR/packages/shared"
cp packages/shared/package.json "$PKG_DIR/packages/shared/"
rsync -a --exclude '*.map' packages/shared/dist "$PKG_DIR/packages/shared/"

mkdir -p "$PKG_DIR/apps/api"
cp apps/api/package.json "$PKG_DIR/apps/api/"
rsync -a --exclude '*.map' apps/api/dist "$PKG_DIR/apps/api/"
rsync -a apps/api/prisma "$PKG_DIR/apps/api/"

mkdir -p "$PKG_DIR/apps/web"
if [ -f apps/web/package.json ]; then
  cp apps/web/package.json "$PKG_DIR/apps/web/"
fi
rsync -a apps/web/dist "$PKG_DIR/apps/web/"

echo "==> Creating zip"
(cd "$PKG_DIR" && zip -qr "$ZIP" .)

ls -lh "$ZIP"
ZIP_BYTES="$(wc -c < "$ZIP" | tr -d ' \n')"
echo "zip size: ${ZIP_BYTES} bytes (~$((ZIP_BYTES / 1024 / 1024))MB)"

if [ "${ZIP_BYTES}" -ge "${MAX_ZIP_BYTES}" ]; then
  echo "::error::Slim package exceeds ${MAX_ZIP_BYTES} bytes" >&2
  exit 1
fi

echo "==> Package sanity check"
ZIP_LIST="$(mktemp)"
trap 'rm -f "$ZIP_LIST"' EXIT
unzip -l "$ZIP" > "$ZIP_LIST"
for required in \
  squarecloud.app \
  start-prod.sh \
  client.p12 \
  package.json \
  apps/api/dist/main.js \
  apps/web/dist/index.html \
  apps/api/prisma/schema.prisma; do
  if ! grep -Fq "$required" "$ZIP_LIST"; then
    echo "::error::Missing ${required} in zip" >&2
    exit 1
  fi
done

if grep -Fq 'node_modules/' "$ZIP_LIST"; then
  echo "::error::Slim zip must not include node_modules" >&2
  exit 1
fi

echo "PIXFLOW_PACKAGE=${ZIP}"

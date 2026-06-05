#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1090
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20 >/dev/null 2>&1 || true
export PATH="$NVM_DIR/versions/node/v20.20.2/bin:$PATH"

SUBDOMAIN="${WEB_SUBDOMAIN:-iptv-manager}"
JWT_SECRET="${JWT_SECRET:-supersecretjwtkey}"
P12_PASSWORD="${P12_PASSWORD:-squarecloud}"
DB_NAME="${DB_NAME:-clientmanagerdb}"

echo "==> Installing dependencies"
npm install

echo "==> Generating Prisma client"
npx prisma generate --schema apps/api/prisma/schema.prisma

if [ -f apps/api/dist/main.js ] && [ -f packages/shared/dist/index.js ]; then
  echo "==> Using prebuilt API/shared dist from package"
else
  echo "==> Building shared + API"
  npm run build -w packages/shared
  npm run build -w apps/api
fi

WORKDIR="$ROOT/deploy/artifacts"
mkdir -p "$WORKDIR"

echo "==> Setting up PostgreSQL on MACBIRD (public host)"
chmod +x "$ROOT/deploy/scripts/setup-remote-postgres.sh"
"$ROOT/deploy/scripts/setup-remote-postgres.sh"
DATABASE_URL="$(cat "$WORKDIR/database_url.txt")"
DATABASE_URL_PUBLIC="$(cat "$WORKDIR/database_url_public.txt")"
export DATABASE_URL

if [ -f deploy/backups/client_manager_20260605.sql ]; then
  echo "==> Resetting database before SQL import"
  runsudo() { if [ -n "${SUDO_PASS:-}" ]; then echo "$SUDO_PASS" | sudo -S "$@"; else sudo "$@"; fi; }
  runsudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'client_manager' AND pid <> pg_backend_pid();" || true
  runsudo -u postgres dropdb --if-exists client_manager
  runsudo -u postgres createdb -O cmuser client_manager
  runsudo -u postgres psql -d client_manager -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'
  echo "==> Importing local SQL dump (schema + data)"
  psql "$DATABASE_URL" -f deploy/backups/client_manager_20260605.sql || echo "WARN: SQL import failed"
else
  echo "==> Running Prisma migrations"
  npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
fi

echo "==> Building API zip"
API_DIR="$WORKDIR/api-package"
rm -rf "$API_DIR" "$WORKDIR/api.zip"
mkdir -p "$API_DIR"
cp deploy/squarecloud/api/squarecloud.app "$API_DIR/"
cp package.json package-lock.json "$API_DIR/" 2>/dev/null || cp package.json "$API_DIR/"
cp -r packages "$API_DIR/"
mkdir -p "$API_DIR/apps"
cp -r apps/api "$API_DIR/apps/api"
cat > "$API_DIR/.env" <<EOF
DATABASE_URL=${DATABASE_URL_PUBLIC}?schema=public
JWT_SECRET=${JWT_SECRET}
CREDENTIALS_ENCRYPTION_KEY=${JWT_SECRET}
API_PUBLIC_BASE_URL=https://iptv-manager-api.squareweb.app
EOF

command -v zip >/dev/null || sudo DEBIAN_FRONTEND=noninteractive apt-get install -y zip
(cd "$API_DIR" && zip -r "$WORKDIR/api.zip" . -x "**/node_modules/*")

echo "==> Uploading API (deploy/artifacts/api.zip)"
squarecloud upload --file deploy/artifacts/api.zip

echo "==> Resolving API public URL"
API_URL=$(squarecloud app list 2>/dev/null | grep -i "iptv-manager-api" | head -1 || true)
if [ -z "$API_URL" ]; then
  API_URL="https://iptv-manager-api.squareweb.app"
fi
# fallback pattern used by Square for display name slug
API_BASE="https://iptv-manager-api.squareweb.app"
echo "Using API base: $API_BASE"

VITE_API_URL="${API_BASE}/api"
if [ -f apps/web/dist/index.html ]; then
  echo "==> Rebuilding web to bake VITE_API_URL=${VITE_API_URL}"
  export VITE_API_URL
  npm run build -w packages/shared
  npm run build -w apps/web
else
  echo "==> Building Web"
  export VITE_API_URL
  npm run build -w packages/shared
  npm run build -w apps/web
fi

WEB_DIR="$WORKDIR/web-package"
rm -rf "$WEB_DIR" "$WORKDIR/web.zip"
mkdir -p "$WEB_DIR"
cp deploy/squarecloud/web/squarecloud.app "$WEB_DIR/"
cp deploy/squarecloud/web/package.json "$WEB_DIR/"
cp -r apps/web/dist/. "$WEB_DIR/"

(cd "$WEB_DIR" && zip -r "$WORKDIR/web.zip" .)

echo "==> Uploading Web (deploy/artifacts/web.zip)"
squarecloud upload --file deploy/artifacts/web.zip

echo "==> Starting apps"
squarecloud app start iptv-manager-api 2>/dev/null || true
squarecloud app start iptv-manager 2>/dev/null || true

echo "==> Importing local SQL dump (if database + dump exist)"
if [ -f "$WORKDIR/database_url.txt" ] && [ -f deploy/backups/client_manager_20260605.sql ]; then
  if command -v psql >/dev/null 2>&1; then
    psql "$(cat "$WORKDIR/database_url.txt")" -f deploy/backups/client_manager_20260605.sql || echo "WARN: SQL import failed"
  else
    echo "WARN: psql not installed; import SQL manually"
  fi
fi

cat > "$WORKDIR/deploy-summary.txt" <<EOF
Deploy finished.
Web: https://${SUBDOMAIN}.squareweb.app
API: ${API_BASE}
VITE_API_URL: ${VITE_API_URL}
JWT_SECRET: ${JWT_SECRET}
Set in Square API app ENV:
  DATABASE_URL
  JWT_SECRET=${JWT_SECRET}
  CREDENTIALS_ENCRYPTION_KEY=${JWT_SECRET}
  API_PUBLIC_BASE_URL=${API_BASE}
EOF

cat "$WORKDIR/deploy-summary.txt"

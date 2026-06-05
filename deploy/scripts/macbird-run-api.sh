#!/usr/bin/env bash
# Run ONLY on MACBIRD.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
ARTIFACTS="$ROOT/deploy/artifacts"
mkdir -p "$ARTIFACTS"

# shellcheck disable=SC1091
source "$ROOT/deploy/scripts/macbird-common.sh"
macbird_load_nvm

LOCAL_DB="postgresql://cmuser:cm_prod_2026@127.0.0.1:5432/client_manager?schema=public"

echo "==> Ensure Postgres is up"
macbird_ensure_postgres

echo "==> Install dependencies"
npm install

echo "==> Prisma generate + migrate"
npx prisma generate --schema apps/api/prisma/schema.prisma
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

cat > apps/api/.env <<EOF
DATABASE_URL=${LOCAL_DB}
JWT_SECRET=supersecretjwtkey
CREDENTIALS_ENCRYPTION_KEY=supersecretjwtkey
PORT=3001
NODE_ENV=production
EOF

if ! command -v pm2 >/dev/null; then
  npm install -g pm2
fi

echo "==> Start API via PM2 (TypeScript runtime)"
if pm2 describe cm-api >/dev/null 2>&1; then
  pm2 delete cm-api || true
fi
pm2 start npm --name cm-api --cwd "$ROOT" -- run start:ts -w apps/api
pm2 save
sleep 5

echo "==> Local health check"
macbird_local_health

if ! command -v cloudflared >/dev/null; then
  echo "==> Install cloudflared"
  curl -fsSL -o /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
  chmod +x /tmp/cloudflared
  macbird_runsudo mv /tmp/cloudflared /usr/local/bin/cloudflared
fi

pkill -f 'cloudflared tunnel --url http://127.0.0.1:3001' 2>/dev/null || true
sleep 2
: > "$ARTIFACTS/cloudflared.log"
nohup cloudflared tunnel --url http://127.0.0.1:3001 >>"$ARTIFACTS/cloudflared.log" 2>&1 &
echo $! > "$ARTIFACTS/cloudflared.pid"

API_URL=""
for _ in $(seq 1 30); do
  API_URL="$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$ARTIFACTS/cloudflared.log" | head -1 || true)"
  if [ -n "$API_URL" ]; then
    break
  fi
  sleep 2
done

if [ -z "$API_URL" ]; then
  echo "ERROR: cloudflared tunnel URL not found"
  tail -30 "$ARTIFACTS/cloudflared.log" || true
  exit 1
fi

echo "$API_URL" > "$ARTIFACTS/api_public_url.txt"

cat > apps/api/.env <<EOF
DATABASE_URL=${LOCAL_DB}
JWT_SECRET=supersecretjwtkey
CREDENTIALS_ENCRYPTION_KEY=supersecretjwtkey
PORT=3001
NODE_ENV=production
API_PUBLIC_BASE_URL=${API_URL}
EOF
pm2 restart cm-api --update-env

echo "==> API public URL (from cloudflared log): $API_URL"
echo "    Health validated on localhost only."

cat > "$ARTIFACTS/macbird-api-summary.txt" <<SUMMARY
API running on MACBIRD via PM2 (port 3001, start:ts)
Public URL (cloudflared): ${API_URL}
Health: ${API_URL}/health
VITE_API_URL: ${API_URL}/api
Webhook pattern: ${API_URL}/api/webhooks/payment/{tenantId}/mercadopago
SUMMARY
cat "$ARTIFACTS/macbird-api-summary.txt"

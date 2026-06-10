#!/usr/bin/env bash
# Run PixFlow dev stack on macbird (API + Vite) pointing to production Evolution.
set -euo pipefail

ROOT="${ROOT:-$HOME/projetos/client-manager}"
cd "$ROOT"

# shellcheck disable=SC1091
if [ -f "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$HOME/.nvm/nvm.sh"
fi
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:${PATH:-/usr/bin:/bin}"

EVOLUTION_BASE_URL="${EVOLUTION_BASE_URL:-https://evolution-pixflow.squareweb.app}"
EVOLUTION_API_KEY="${EVOLUTION_API_KEY:-$(grep '^AUTHENTICATION_API_KEY=' "$HOME/projetos/evolution-squarecloud/.env" 2>/dev/null | cut -d= -f2- || true)}"
DATABASE_URL="${DATABASE_URL:-postgresql://cmuser:cm_prod_2026@127.0.0.1:5432/client_manager?schema=public}"
JWT_SECRET="${JWT_SECRET:-supersecretjwtkey}"
CREDENTIALS_ENCRYPTION_KEY="${CREDENTIALS_ENCRYPTION_KEY:-supersecretjwtkey}"
API_PORT="${API_PORT:-3001}"
WEB_PORT="${WEB_PORT:-5173}"
LAN_IP="${LAN_IP:-$(hostname -I 2>/dev/null | awk '{print $1}')}"

if [ -z "$EVOLUTION_API_KEY" ]; then
  echo "ERROR: EVOLUTION_API_KEY not set and not found in ~/projetos/evolution-squarecloud/.env"
  exit 1
fi

mkdir -p "$ROOT/deploy/artifacts"

echo "==> Install deps (if needed)"
npm install

echo "==> Build shared package"
npm run build -w packages/shared

echo "==> Prisma generate"
npx prisma generate --schema apps/api/prisma/schema.prisma

cat > apps/api/.env <<EOF
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
CREDENTIALS_ENCRYPTION_KEY=${CREDENTIALS_ENCRYPTION_KEY}
PORT=${API_PORT}
NODE_ENV=development
EVOLUTION_BASE_URL=${EVOLUTION_BASE_URL}
EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
BILLING_SCHEDULER_INTERVAL_MINUTES=${BILLING_SCHEDULER_INTERVAL_MINUTES:-10}
BILLING_SCHEDULER_TZ=${BILLING_SCHEDULER_TZ:-America/Sao_Paulo}
EOF

cat > apps/web/.env.local <<EOF
VITE_API_URL=http://${LAN_IP}:${API_PORT}/api
EOF

echo "==> Stop previous dev processes (if any)"
pkill -f "ts-node-dev.*apps/api" 2>/dev/null || true
pkill -f "vite.*apps/web" 2>/dev/null || true
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${API_PORT}/tcp" 2>/dev/null || true
fi
sleep 2

echo "==> Start API on 0.0.0.0:${API_PORT}"
nohup npm run dev -w apps/api > "$ROOT/deploy/artifacts/dev-api.log" 2>&1 &
echo $! > "$ROOT/deploy/artifacts/dev-api.pid"

echo "==> Start Vite on 0.0.0.0:${WEB_PORT}"
nohup npm run dev -w apps/web -- --host 0.0.0.0 --port "${WEB_PORT}" > "$ROOT/deploy/artifacts/dev-web.log" 2>&1 &
echo $! > "$ROOT/deploy/artifacts/dev-web.pid"

echo "==> Waiting for services..."
for _ in $(seq 1 30); do
  if curl -sf --max-time 2 "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1 \
    && curl -sf --max-time 2 "http://127.0.0.1:${WEB_PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

cat > "$ROOT/deploy/artifacts/macbird-dev-summary.txt" <<SUMMARY
PixFlow DEV on macbird
Evolution: ${EVOLUTION_BASE_URL}
API local:  http://127.0.0.1:${API_PORT}
API LAN:    http://${LAN_IP}:${API_PORT}
Web LAN:    http://${LAN_IP}:${WEB_PORT}
VITE_API_URL=http://${LAN_IP}:${API_PORT}/api

Logs:
  ${ROOT}/deploy/artifacts/dev-api.log
  ${ROOT}/deploy/artifacts/dev-web.log
SUMMARY

cat "$ROOT/deploy/artifacts/macbird-dev-summary.txt"

curl -sf --max-time 5 "http://127.0.0.1:${API_PORT}/health" && echo

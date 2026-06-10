#!/usr/bin/env bash
set -euo pipefail
cd ~/projetos/client-manager

# shellcheck disable=SC1091
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:${PATH:-/usr/bin:/bin}"

echo "==> Stop PM2 (old dist/main.js on :3001)"
if command -v pm2 >/dev/null; then
  pm2 list || true
  pm2 delete all 2>/dev/null || true
  pm2 kill 2>/dev/null || true
fi
pkill -f 'dist/main.js' 2>/dev/null || true
pkill -f 'npm run start' 2>/dev/null || true
sleep 2

PID=$(ss -tlnp 2>/dev/null | grep ':3001 ' | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1 || true)
if [ -n "$PID" ]; then kill -9 "$PID"; sleep 1; fi

if ss -tlnp | grep -q ':3001 '; then
  echo "ERROR: 3001 still busy"; ss -tlnp | grep 3001; exit 1
fi

EVOLUTION_BASE_URL="${EVOLUTION_BASE_URL:-https://evolution-pixflow.squareweb.app}"
EVOLUTION_API_KEY="${EVOLUTION_API_KEY:-$(grep '^AUTHENTICATION_API_KEY=' "$HOME/projetos/evolution-squarecloud/.env" | cut -d= -f2-)}"
LAN_IP=$(hostname -I | awk '{print $1}')

cat > apps/api/.env <<EOF
DATABASE_URL=postgresql://cmuser:cm_prod_2026@127.0.0.1:5432/client_manager?schema=public
JWT_SECRET=supersecretjwtkey
CREDENTIALS_ENCRYPTION_KEY=supersecretjwtkey
PORT=3001
NODE_ENV=development
EVOLUTION_BASE_URL=${EVOLUTION_BASE_URL}
EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
EOF

echo "VITE_API_URL=http://${LAN_IP}:3001/api" > apps/web/.env.local

echo "==> Start API (ts-node-dev with latest source)"
nohup npm run dev -w apps/api > deploy/artifacts/dev-api.log 2>&1 &
echo $! > deploy/artifacts/dev-api.pid

for _ in $(seq 1 25); do
  curl -sf --max-time 2 http://127.0.0.1:3001/health >/dev/null && break
  sleep 1
done

HTTP=$(curl -sS -o /tmp/evo.json -w '%{http_code}' http://127.0.0.1:3001/api/settings/whatsapp/evolution/connection)
echo "evolution/connection => HTTP ${HTTP} (401=OK, 404=bad)"
cat /tmp/evo.json; echo

grep 'whatsapp/evolution' deploy/artifacts/dev-api.log | head -3 || true

echo "Web: http://${LAN_IP}:5173"

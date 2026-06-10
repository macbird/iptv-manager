#!/usr/bin/env bash
set -euo pipefail
cd ~/projetos/client-manager

# shellcheck disable=SC1091
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:${PATH:-/usr/bin:/bin}"

API_PORT=3001
WEB_PORT=5173

echo "==> Kill everything on ${API_PORT} and ${WEB_PORT}"
for pid in $(ss -tlnp 2>/dev/null | grep ":${API_PORT} " | grep -oP 'pid=\K[0-9]+' || true); do
  kill -9 "$pid" 2>/dev/null || true
done
pkill -9 -f 'ts-node-dev.*src/main.ts' 2>/dev/null || true
pkill -9 -f 'node.*apps/api' 2>/dev/null || true
sleep 2

if ss -tlnp | grep -q ":${API_PORT} "; then
  echo "ERROR: port ${API_PORT} still in use"
  ss -tlnp | grep ":${API_PORT} "
  exit 1
fi

echo "==> Start API"
nohup npm run dev -w apps/api > deploy/artifacts/dev-api.log 2>&1 &
echo $! > deploy/artifacts/dev-api.pid

for _ in $(seq 1 20); do
  if curl -sf --max-time 2 "http://127.0.0.1:${API_PORT}/health" >/dev/null; then
    break
  fi
  sleep 1
done

echo "==> Verify evolution route (expect 401 without token, NOT 404)"
HTTP=$(curl -sS -o /tmp/evo_test.json -w '%{http_code}' "http://127.0.0.1:${API_PORT}/api/settings/whatsapp/evolution/connection")
echo "HTTP ${HTTP}"
cat /tmp/evo_test.json
echo

echo "==> Routes in log"
grep -i 'whatsapp/evolution' deploy/artifacts/dev-api.log | head -5 || grep 'evolution' deploy/artifacts/dev-api.log | head -5 || echo 'check full log'

echo "==> Restart Vite if down"
if ! curl -sf --max-time 2 "http://127.0.0.1:${WEB_PORT}/" >/dev/null; then
  pkill -f 'vite.*5173' 2>/dev/null || true
  LAN_IP=$(hostname -I | awk '{print $1}')
  echo "VITE_API_URL=http://${LAN_IP}:${API_PORT}/api" > apps/web/.env.local
  nohup npm run dev -w apps/web -- --host 0.0.0.0 --port "${WEB_PORT}" > deploy/artifacts/dev-web.log 2>&1 &
  echo $! > deploy/artifacts/dev-web.pid
fi

echo DONE

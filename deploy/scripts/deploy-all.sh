#!/usr/bin/env bash
# Full deploy — run ONLY on MACBIRD (never from the corporate laptop).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
ARTIFACTS="$ROOT/deploy/artifacts"
mkdir -p "$ARTIFACTS"

echo "========================================"
echo " Client Manager deploy"
echo " Host: $(hostname)"
echo " Date: $(date -Is)"
echo " Path: $ROOT"
echo "========================================"

if [ "${SKIP_GIT_PULL:-0}" != "1" ]; then
  chmod +x deploy/scripts/*.sh
  ./deploy/scripts/sync-from-git.sh
fi

./deploy/scripts/macbird-run-api.sh 2>&1 | tee "$ARTIFACTS/macbird-api.log"
./deploy/scripts/macbird-deploy-web.sh 2>&1 | tee "$ARTIFACTS/macbird-web.log"

echo ""
echo "==> Deploy concluído"
cat "$ARTIFACTS/deploy-summary.txt"

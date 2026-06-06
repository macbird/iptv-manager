#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [ ! -d .git ]; then
  echo "ERROR: $ROOT is not a git repository."
  echo "Clone the repo on MACBIRD first, e.g.:"
  echo "  git clone <repo-url> ~/client-manager"
  exit 1
fi

BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Sync code from git (branch: $BRANCH)"
git fetch origin "$BRANCH"
git pull --ff-only origin "$BRANCH"
echo "==> Current commit: $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"

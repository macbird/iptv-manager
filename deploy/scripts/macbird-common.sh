#!/usr/bin/env bash
# Shared helpers for MACBIRD deploy scripts (run only on the remote host).

macbird_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[1]:-${BASH_SOURCE[0]}}")" && pwd)"
  cd "$(dirname "$script_dir")/.." && pwd
}

macbird_load_nvm() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1090
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
  fi
  export PATH="$NVM_DIR/versions/node/v20.20.2/bin:${PATH:-/usr/bin:/bin}"
}

macbird_runsudo() {
  if [ -n "${SUDO_PASS:-}" ]; then
    echo "$SUDO_PASS" | sudo -S "$@"
  else
    sudo "$@"
  fi
}

macbird_ensure_postgres() {
  macbird_runsudo service postgresql start 2>/dev/null \
    || macbird_runsudo systemctl start postgresql \
    || true
  macbird_runsudo pg_ctlcluster 12 main start 2>/dev/null || true
}

macbird_local_health() {
  curl -sf --max-time 5 http://127.0.0.1:3001/health
  echo
}

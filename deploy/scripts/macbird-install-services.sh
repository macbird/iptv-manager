#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
USER_NAME="$(whoami)"

runsudo() {
  if [ -n "${SUDO_PASS:-}" ]; then
    echo "$SUDO_PASS" | sudo -S "$@"
  else
    sudo "$@"
  fi
}

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1090
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/v20.20.2/bin:$PATH"

pm2 startup systemd -u "$USER_NAME" --hp "$HOME" | tail -1 | runsudo bash || true
pm2 save

runsudo tee /etc/systemd/system/cm-cloudflared.service >/dev/null <<UNIT
[Unit]
Description=Client Manager API cloudflared tunnel
After=network.target

[Service]
Type=simple
User=${USER_NAME}
ExecStart=/usr/local/bin/cloudflared tunnel --url http://127.0.0.1:3001
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

runsudo systemctl daemon-reload
runsudo systemctl enable cm-cloudflared.service
runsudo systemctl restart cm-cloudflared.service

echo "PM2 + cloudflared systemd services installed"

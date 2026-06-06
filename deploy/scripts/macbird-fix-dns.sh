#!/usr/bin/env bash
set -euo pipefail

runsudo() {
  if [ -n "${SUDO_PASS:-}" ]; then
    echo "$SUDO_PASS" | sudo -S "$@"
  else
    sudo "$@"
  fi
}

runsudo mkdir -p /etc/systemd/resolved.conf.d
runsudo tee /etc/systemd/resolved.conf.d/dns.conf >/dev/null <<'EOF'
[Resolve]
DNS=8.8.8.8 1.1.1.1
FallbackDNS=9.9.9.9
EOF

runsudo systemctl restart systemd-resolved 2>/dev/null || true
echo "DNS updated to 8.8.8.8 / 1.1.1.1"

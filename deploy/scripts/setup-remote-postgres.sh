#!/usr/bin/env bash
set -euo pipefail

runsudo() {
  if [ -n "${SUDO_PASS:-}" ]; then
    echo "$SUDO_PASS" | sudo -S "$@"
  else
    sudo "$@"
  fi
}

DB_NAME="${DB_NAME:-client_manager}"
DB_USER="${DB_USER:-cmuser}"
DB_PASS="${DB_PASS:-cm_prod_2026}"
PUBLIC_IP="${PUBLIC_IP:-$(curl -s ifconfig.me)}"

if ! command -v psql >/dev/null 2>&1; then
  echo "==> Installing PostgreSQL"
  runsudo DEBIAN_FRONTEND=noninteractive apt-get update -y
  runsudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-client
fi

runsudo service postgresql start || runsudo systemctl start postgresql
runsudo pg_ctlcluster 12 main start 2>/dev/null || true

runsudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || runsudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

runsudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || runsudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"

runsudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
runsudo -u postgres psql -d "${DB_NAME}" -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'

PG_CONF=$(runsudo -u postgres psql -t -P format=unaligned -c 'SHOW config_file')
PG_DIR=$(dirname "$PG_CONF")
runsudo sed -i "s/^#*listen_addresses.*/listen_addresses = '*'/" "$PG_CONF"
echo "host all all 0.0.0.0/0 scram-sha-256" | runsudo tee -a "${PG_DIR}/pg_hba.conf" >/dev/null
runsudo service postgresql restart || runsudo systemctl restart postgresql

if command -v ufw >/dev/null 2>&1; then
  runsudo ufw allow 5432/tcp || true
fi

LOCAL_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
PUBLIC_URL="postgresql://${DB_USER}:${DB_PASS}@${PUBLIC_IP}:5432/${DB_NAME}"
echo "$LOCAL_URL" > deploy/artifacts/database_url.txt
echo "$PUBLIC_URL" > deploy/artifacts/database_url_public.txt
echo "Postgres ready (local): $LOCAL_URL"
echo "Postgres ready (public): $PUBLIC_URL"

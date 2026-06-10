# Deploy no MACBIRD

Todo o deploy roda **no MACBIRD** (`192.168.18.88`).  
**Não** use scripts Python/Paramiko no notebook corporativo — isso gerou alerta no CrowdStrike.

## Pré-requisitos (uma vez no MACBIRD)

```bash
git clone <url-do-repo> ~/client-manager
cd ~/client-manager
```

## Square Cloud — pipeline (GitHub Actions)

Push em `main` → `.github/workflows/deploy.yml`

| Step | O que faz |
|------|-----------|
| 1. Install + Build | `npm install` + `npm run build` (Node 24) |
| 2. Prepare | `client.p12` + `start-prod.sh` + env vars |
| 3. Migrations | `prisma migrate deploy` no CI (com p12 local) |
| 4. Slim zip | `dist` + `package.json` + prisma — **sem node_modules** (~5–15MB) |
| 5. Commit | API Square Cloud (`MEMORY=512`) |
| 6. Verify | `/health` + `/health/db` (até ~10 min no 1º boot) |

### Por que zip slim?

Testes na API Square Cloud (macbird):

- Zip **~1KB** + `MEMORY=512` → sucesso
- Zip **~88MB** com `node_modules` → `CLUSTER_COMMIT_FAILED` (400)
- Plano **standard-4** sem RAM livre → `MEMORY` no zip deve ser **512**

Monorepo com `node_modules` no zip **não cabe** no commit da Square Cloud.

### Boot da app

`start-prod.sh` instala deps **só quando o SHA do deploy muda** (ou se faltam argon2/prisma):

```bash
npm install --omit=dev → prisma generate → node apps/api/dist/main.js
```

Restarts do mesmo deploy **não** reinstalam.

### Fail-fast

- `bash -euo pipefail` em todos os steps
- Commit via API com JSON de erro explícito
- Verify só roda se commit passou (`if: success()`)

### Diagnóstico

```bash
squarecloud app status 09455ba819f445af9c92a3d8319e26b4
squarecloud app logs 09455ba819f445af9c92a3d8319e26b4 | tail -80
curl -sS https://pixflow.squareweb.app/health
```

## Deploy local (macbird)

```bash
cd ~/client-manager
./deploy/scripts/deploy-all.sh
```

## Credenciais

Use `deploy/CREDENTIALS.local.md` localmente (gitignored).

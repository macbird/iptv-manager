# Deploy no MACBIRD

Todo o deploy roda **no MACBIRD** (`192.168.18.88`).  
**Não** use scripts Python/Paramiko no notebook corporativo — isso gerou alerta no CrowdStrike.

## Pré-requisitos (uma vez no MACBIRD)

```bash
# Clone do repositório
git clone <url-do-repo> ~/client-manager
cd ~/client-manager

# Node via nvm (v20.20.2), pm2, squarecloud CLI, postgres, cloudflared
# já configurados no ambiente de produção
```

## Deploy completo

Conecte no MACBIRD (SSH ou console local) e execute:

```bash
cd ~/client-manager
chmod +x deploy/scripts/*.sh
./deploy/scripts/deploy-all.sh
```

O script faz, **no MACBIRD**:

1. `git pull` (branch `main`)
2. `npm install`, Prisma migrate, PM2 API (`start:ts`)
3. Cloudflared Quick Tunnel (se necessário)
4. Build da web + commit na Square Cloud

## Comandos úteis (sempre no MACBIRD)

```bash
# Só API
./deploy/scripts/macbird-run-api.sh

# Só web (requer api_public_url.txt)
./deploy/scripts/macbird-deploy-web.sh

# Status (health só em localhost)
./deploy/scripts/status.sh

# Deploy sem git pull (código já atualizado)
SKIP_GIT_PULL=1 ./deploy/scripts/deploy-all.sh
```

## Atualizar código antes do deploy

No seu ambiente de desenvolvimento, faça `git push`.  
No MACBIRD, `deploy-all.sh` puxa automaticamente.

## O que NÃO fazer no notebook corporativo

- `python deploy/macbird-deploy.py`
- `python deploy/remote-*.py`
- `python -c` com Paramiko + senha SSH
- `curl` para `*.trycloudflare.com` a partir da máquina NTTD

## Artefatos

Logs e URLs ficam em `deploy/artifacts/` (gitignored):

- `api_public_url.txt` — URL atual do túnel
- `deploy-summary.txt` — resumo do último deploy
- `macbird-api.log` / `macbird-web.log`

## Credenciais

Use `deploy/CREDENTIALS.local.md` apenas localmente (gitignored).  
Não commitar senhas nem tokens.

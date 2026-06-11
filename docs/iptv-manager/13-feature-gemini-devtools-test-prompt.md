# Prompt Gemini — Teste Feature 13 (DevTools)

Cole o bloco abaixo no Gemini (ou outro assistente com acesso ao browser) para testar a Feature 13 localmente usando Chrome DevTools.

---

## Prompt

```
Você é um QA sênior testando a Feature 13 do PixFlow (Cliente Manager) em ambiente LOCAL.

## Ambiente
- API: http://localhost:3001
- Web: http://localhost:5173
- Branch: feature/13-mercadopago-only-api-errors
- Admin seed: admin@clientemanager.com / AdminPassword123!

## Objetivo da feature
1. Travar pagamentos somente em Mercado Pago (sem Asaas/Efi na UI)
2. Erros da API devem retornar { message, code } e aparecer nos toasts com motivo real

## Como testar
Para CADA cenário:
1. Abra DevTools (F12) → aba Network → filtre "Fetch/XHR"
2. Execute a ação na UI
3. Clique na requisição falha (status 4xx/5xx)
4. Na aba Response, confirme JSON com `message` e `code`
5. Confirme que o toast na tela mostra o mesmo `message` (não genérico)
6. Registre: PASS ou FAIL + screenshot mental do body

## Cenários obrigatórios

### A — MP único (tenant)
- Login tenant → Configurações → aba Pagamentos
- ESPERADO: texto fixo "Mercado Pago", SEM combobox Asaas/Efi
- ESPERADO: copy sobre "versões futuras"

### B — MP único (admin)
- Login /admin/login → Configurações
- ESPERADO: Provider PIX = Mercado Pago (read-only)

### C — API bloqueia Asaas
- Com token tenant no DevTools Console:
  fetch('http://localhost:3001/api/settings/payment-credentials', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ credentials: [{ provider: 'asaas', active: true }] })
  }).then(r => r.json()).then(console.log)
- ESPERADO: status 400, code PAYMENT_PROVIDER_DISABLED

### D — PIX sem credencial
- Tenant → Faturas → fatura aberta → Gerar PIX (sem token MP salvo)
- ESPERADO: toast com "Credencial do Mercado Pago..." 
- ESPERADO: code PAYMENT_CREDENTIALS_MISSING ou PAYMENT_PROVIDER_ERROR na Network

### E — WhatsApp desconectado
- Configurações → WhatsApp desconectado → Fatura → Enviar cobrança
- ESPERADO: toast "WhatsApp não conectado..."
- ESPERADO: code WHATSAPP_NOT_CONNECTED (409)

### F — Slug inválido (admin)
- /admin/accounts/new → Identificador "Toro TV" → salvar
- ESPERADO: VALIDATION_ERROR ou mensagem de identificador inválido no toast/campo

### G — 404 padronizado
- GET http://localhost:3001/api/invoices/00000000-0000-0000-0000-000000000000 (com token)
- ESPERADO: { message, code: "NOT_FOUND" }

### H — useCrud / admin
- Admin → Contas → criar conta com e-mail duplicado
- ESPERADO: toast com mensagem da API (ex. duplicado), não só "Erro ao criar conta"

### I — Banner legado (se aplicável)
- Se conta tinha Asaas ativo no banco: banner amarelo em Pagamentos

## Formato do relatório final

| # | Cenário | Status | HTTP | code | Toast OK? | Observação |
|---|---------|--------|------|------|-----------|------------|
| A | ... | PASS/FAIL | | | | |

Liste bugs encontrados com: rota, status, body, mensagem exibida vs esperada.
```

---

## Testes automatizados (local)

```powershell
cd C:\Users\jpaulosi\projetos\client-manager
npm run build -w packages/shared
cd apps\api
npm test
```

Suites relevantes:
- `api-error.mapper.test.ts`
- `send-api-error.test.ts`
- `api-error-codes.test.ts` (shared)

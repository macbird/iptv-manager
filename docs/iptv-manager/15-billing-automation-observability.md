# Feature 15 — Automação de cobrança: observabilidade e scheduler

**Status:** 📋 Backlog  
**Prioridade:** Média  
**Última revisão:** 11/06/2026  

Relacionado: [12-billing-automation-scheduler.md](./12-billing-automation-scheduler.md)

---

## Objetivo

Dar **visibilidade e previsibilidade** à automação D-N: o tenant vê o último run, erros reais e o horário efetivo de execução.

---

## Problemas atuais

| Item | Detalhe |
|------|---------|
| `automationRunMinute` | Persistido na UI/DB, **não usado** pelo `billing-scheduler` |
| Erros do job | Ficam em `billing_job_runs.summary.errors` — UI não exibe |
| Reenvio | Cobrança já enviada é ignorada sem feedback na UI de automação |
| Previsão | Sem “quem entra amanhã às 10h” na tela |

---

## Escopo

- UI Configurações → Automação: card **Última execução** (hora, enviados, ignorados, erros).
- API `GET /api/settings/billing-automation/last-run` (tenant) ou incluir no settings aggregate.
- Decisão produto: implementar `automationRunMinute` no cron **ou** remover campo da UI até suportar.
- Opcional: botão “Simular próximo run” (dry-run, sem enviar WhatsApp).

---

## Critérios de aceite

- [ ] Após run do scheduler, tenant vê resumo na UI em até 1 refresh.
- [ ] Erro `WHATSAPP_NOT_CONNECTED` aparece legível (Feature 13 + este card).
- [ ] Documentação do scheduler alinhada ao comportamento real.

**Estimativa:** ~2 dias.

# Feature 17 — Job mensal de faturas SaaS (plataforma → tenant)

**Status:** 📋 Backlog  
**Prioridade:** Média  
**Última revisão:** 11/06/2026  

Relacionado: [10-billing-dual-layer.md](./10-billing-dual-layer.md) · Fase 2.5

---

## Objetivo

Automatizar a **geração mensal** de faturas `scope=platform` para cada tenant ativo, conforme plano SaaS e `dueDay` da assinatura.

---

## Estado atual

- Fatura SaaS criada **manualmente** pelo admin (`POST /admin/tenants/:id/invoices`).
- Sem BullMQ/cron dedicado para ciclo mensal.
- Critério de pronto da Fase 2.5 ainda parcial.

---

## Escopo

- Scheduler ou job BullMQ: dia configurável (ex.: 1º dia útil ou `dueDay - N`).
- Idempotência por `billingCycleKey` + `accountId`.
- Notificação admin (opcional) com resumo de faturas geradas.
- Logs em tabela de job runs (reutilizar padrão `billing_job_runs` ou nova entidade).

**Estimativa:** ~3 dias.

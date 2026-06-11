# Feature 16 — WhatsApp pós-pagamento e templates D-N (`payment_block`)

**Status:** 📋 Backlog  
**Prioridade:** Média  
**Última revisão:** 11/06/2026  

Relacionado: [03-integrations-pix-whatsapp.md](./03-integrations-pix-whatsapp.md) · Fase 4 do roadmap

---

## Objetivo

1. Garantir **notificação ao tenant** quando cliente paga (código existe em `PaymentReceivedNotificationService`).
2. Evoluir templates de cobrança automática com placeholder `{{payment_block}}` (PIX + link híbrido futuro).

---

## Estado atual

- Notificação pós-pagamento: implementada após `PaymentConfirmationService.confirm` — depende WhatsApp conectado + `accounts.phone`.
- Templates D-N: texto + `{{pix}}` em mensagens separadas; sem bloco unificado.
- UI: telefone de notificação da conta pode não estar exposto (ver Feature 14).

---

## Escopo

- Expor/configurar telefone de notificação do tenant (owner/conta).
- Smoke: pagamento MP → mensagem “recebemos seu pagamento” no WhatsApp do tenant.
- Parser de templates: `{{payment_block}}` substituído por PIX EMV (e futuro link).
- Testes de renderização de template com contexto real.

**Estimativa:** ~2,5 dias.

# Feature 18 — Entrega híbrida de pagamento (congelada)

**Status:** 🧊 Congelada enquanto **MP-only** (Feature 13)  
**Prioridade:** Baixa  
**Última revisão:** 11/06/2026  

Relacionado: [10-billing-dual-layer.md](./10-billing-dual-layer.md)

---

## Objetivo (quando reativada)

Suportar **PIX EMV + link de checkout** (InfinitePay / similares) na mesma cobrança WhatsApp, com campos `paymentDeliveryType`, `checkoutUrl` e adapters adicionais.

---

## Por que congelada

Decisão de produto: operar somente com **Mercado Pago PIX** até nova priorização. Implementar híbrido agora aumentaria superfície de PSP e conflita com Feature 13.

---

## Pré-requisitos para reabrir

- [ ] Feature 13 em produção estável.
- [ ] Catálogo `ENABLED_PAYMENT_PROVIDER_VALUES` expandido com provider de link.
- [ ] Webhook e credenciais do novo PSP.

**Estimativa quando reativada:** ~5 dias.

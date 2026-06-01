# Cobrança em duas camadas — Plataforma e Tenant

Este documento define como o **Cliente Manager** cobra em dois níveis usando o **mesmo mecanismo de domínio**, evitando dois sistemas de PIX/fatura/webhook separados.

| Camada | Quem paga | Quem recebe | Exemplo |
|--------|-----------|-------------|---------|
| **Plataforma (SaaS)** | Tenant (`account`) | Você (dono da plataforma) | R$ 49,90/mês pelo uso do app |
| **Tenant (revenda)** | Cliente final (`customer`) | Tenant (revendedor) | R$ 35,00/mês da assinatura IPTV |

---

## Princípio: um motor, dois escopos

```
packages/shared          → enums InvoiceStatus, BillingScope, DTOs Zod
apps/api/modules/billing → invoice, payment, webhooks (scope-aware)
apps/api/integrations/payment → PaymentProvider (Asaas, …)
```

Toda fatura tem:

| Campo | Plataforma | Tenant |
|-------|------------|--------|
| `scope` | `platform` | `tenant` |
| `accountId` | tenant cobrado | tenant credor |
| `customerId` | `null` | cliente cobrado |
| `amount` | valor do **PlatformPlan** (admin em Configurações) | valor do **`Plan`** do cliente (`/plans`) |
| `billingCycleKey` | `2026-06` | `2026-06` |
| `dueDate` | calculado por `due_day` da assinatura | `due_day` do cliente ou ciclo |
| `status` | draft → open → paid / overdue / canceled | idem |

**Pagamento** referencia `invoiceId`, guarda `providerPaymentId` (UNIQUE, P0.3), método `pix | manual`.

---

## Configuração PIX (duas contas PSP)

| Config | Onde | Quem paga taxa PSP |
|--------|------|---------------------|
| `platform_payment_config` | 1 registro global (env ou tabela) | Conta Asaas **sua** (plataforma) |
| `tenant_payment_config` | 1 por `accountId` | Conta Asaas **do revendedor** |

O adapter não muda — muda só **qual credencial** o factory carrega:

```typescript
// integrations/payment/payment-provider.factory.ts
getProvider({ scope, accountId }): PaymentProvider
```

Webhooks:

| Rota | Escopo |
|------|--------|
| `POST /api/webhooks/pix/platform` | Faturas `scope=platform` |
| `POST /api/webhooks/pix/:tenantSlug` | Faturas `scope=tenant` |

Ambos: idempotência por `provider_payment_id`, audit log, evento interno `PaymentConfirmed`.

---

## Telas de configurações (admin e tenant)

**Mesma UX**, rotas e permissões diferentes. Um layout compartilhado (`SettingsLayout` / abas) com seções que aparecem conforme o **papel**.

| Rota | Quem acessa |
|------|-------------|
| `/admin/settings` | `platform_admin` |
| `/settings` | `account_user` (revendedor) |

### Onde entra o “preço” em cada mundo

| Conceito | Onde se define | Onde aparece |
|----------|---------------|--------------|
| **Preço do app (SaaS)** | **Admin** em Configurações (`PlatformPlan` / valor mensal da plataforma) | Tenant: **somente leitura** em Configurações → “Minha assinatura” |
| **Preço cobrado do cliente final** | **Tenant** em **Planos** (`/plans` — já existe `Plan.price`) | Faturas `scope=tenant` usam o plano vinculado ao `customer` |
| **Providers (PIX / WhatsApp)** | Cada lado configura o **seu** PSP | Admin: credencial plataforma · Tenant: credencial revenda |

Ou seja: na tela de configurações do **tenant não se edita o valor do Cliente Manager** — esse valor vem do **plano SaaS** que o admin atribuiu à conta. O tenant edita em **Planos** quanto cobra dos **clientes IPTV**.

### Seções da tela (por papel)

```mermaid
flowchart LR
  subgraph admin [Admin /admin/settings]
    A1[Preço do app SaaS]
    A2[Provider PIX plataforma]
    A3[Provider WhatsApp plataforma - opcional]
    A4[Regras inadimplência SaaS]
  end
  subgraph tenant [Tenant /settings]
    T1[Minha assinatura - read-only]
    T2[Provider PIX revenda]
    T3[Provider WhatsApp revenda]
    T4[Automação D-N - Fase 4]
  end
```

| Seção | Admin | Tenant |
|-------|-------|--------|
| **Preço / plano SaaS** | Editar valor mensal (ou planos Starter/Pro), `due_day` default, trial | Exibir: “Você paga R$ X/mês — Plano Y”, próximo vencimento, link copiar PIX da fatura SaaS |
| **PIX — provider** | Select: `asaas` \| `efi` \| `mercadopago` + API key, webhook secret (mascarado) | Idem, gravado em `tenant_payment_config` |
| **WhatsApp — provider** | Opcional (avisos plataforma) | `evolution` \| `meta` + URL/token instância |
| **Automação** | — | Dias antes do vencimento, horário, template (Fase 4) |
| **Equipe** | — | `account_user` convites (backlog) |

### Backend

| Escopo | API |
|--------|-----|
| Plataforma | `GET/PATCH /api/admin/platform-settings` (preço, provider, credenciais criptografadas) |
| Tenant | `GET/PATCH /api/settings` (só `tenant_payment_config`, whatsapp, automation) |
| Tenant (assinatura) | `GET /api/settings/subscription` — read-only: plano SaaS, valor, status, próxima fatura |

**Segurança:** API keys nunca retornam em claro após salvar (só `••••` + botão “substituir”). Secrets no banco criptografados (coluna ou app-level).

### Frontend (reuso)

```
features/settings/
├── pages/SettingsPage.tsx       # detecta admin vs tenant (prop ou rota)
├── sections/
│   ├── PlatformPricingSection.tsx   # só admin
│   ├── MySubscriptionSection.tsx    # só tenant (read-only)
│   ├── PaymentProviderSection.tsx   # ambos (scope via API)
│   └── WhatsAppProviderSection.tsx
└── api/settings.api.ts
```

Admin registra rota em `App.tsx` sob `AdminShell`; tenant sob `AppShell` — **mesmos componentes**, `variant: 'platform' | 'tenant'`.

### Providers disponíveis (select na UI)

**Pagamento (PIX):**

| Valor | Label | MVP |
|-------|-------|-----|
| `asaas` | Asaas | ✅ primeiro |
| `efi` | Efi (Gerencianet) | futuro |
| `mercadopago` | Mercado Pago | futuro |

**WhatsApp:**

| Valor | Label | MVP |
|-------|-------|-----|
| `evolution` | Evolution API | ✅ Fase 4 |
| `meta` | WhatsApp Business API | futuro |

O factory em runtime lê `provider` da config e instancia o adapter correto.

---

## Modelo de dados (proposta Prisma)

### Plataforma (SaaS)

```prisma
model PlatformPlan {
  id          String   @id @default(uuid())
  name        String   // "Starter", "Pro"
  priceCents  Int      // 4990 = R$ 49,90
  billingCycle BillingCycle @default(monthly)
  maxCustomers Int?   // opcional: limite soft
  active      Boolean  @default(true)
}

model AccountSubscription {
  id          String   @id @default(uuid())
  accountId   String   @unique
  account     Account  @relation(...)
  platformPlanId String
  platformPlan PlatformPlan @relation(...)
  dueDay      Int      // 1-28
  status      SubscriptionStatus // active, past_due, canceled
  startedAt   DateTime @default(now())
}
```

### Faturas e pagamentos (unificados)

```prisma
enum BillingScope {
  platform
  tenant
}

enum InvoiceStatus {
  draft
  open
  paid
  overdue
  canceled
}

model Invoice {
  id               String        @id @default(uuid())
  scope            BillingScope
  accountId        String
  customerId       String?       // null se scope=platform
  billingCycleKey  String        // YYYY-MM
  amountCents      Int
  dueDate          DateTime
  status           InvoiceStatus @default(draft)
  pixCopyPaste     String?
  pixQrCode        String?
  providerChargeId String?       @unique
  paidAt           DateTime?
  createdAt        DateTime      @default(now())
  payments         Payment[]
  @@unique([scope, accountId, customerId, billingCycleKey])
}

model Payment {
  id                  String   @id @default(uuid())
  invoiceId           String
  invoice             Invoice  @relation(...)
  amountCents         Int
  method              String   // pix, manual
  providerPaymentId   String?  @unique
  paidAt              DateTime @default(now())
}
```

> O `@@unique` evita duas faturas do mesmo ciclo para o mesmo devedor.

---

## Fluxos

### A) Cobrança mensal SaaS (admin → tenant)

```mermaid
sequenceDiagram
  participant Job as MonthlyBillingJob
  participant API as BillingService
  participant PSP as Asaas (platform)
  participant WH as Webhook
  participant Admin as Admin UI

  Job->>API: Para cada AccountSubscription ativa
  API->>API: Cria Invoice scope=platform, cycle=2026-06
  API->>PSP: createPixCharge
  PSP-->>API: qrCode, copyPaste
  Admin->>API: Lista faturas / reenviar cobrança
  Note over Job: E-mail opcional ao owner
  PSP->>WH: payment confirmed
  WH->>API: idempotent mark paid
  API->>API: subscription status active
```

**Regras de negócio (decidir antes de codar):**

| # | Decisão | Sugestão default |
|---|---------|------------------|
| 1 | Preço SaaS | Plano fixo mensal por tenant (MVP); depois tier por qtd clientes |
| 2 | `due_day` | Dia 10 de cada mês (configurável na assinatura) |
| 3 | Inadimplência | Após N dias `overdue` → suspender `account.status` |
| 4 | Geração | Job cron dia 1 (ou D-3 do vencimento) |
| 5 | Pro-rata | Backlog: não no MVP |

### B) Cobrança tenant → cliente (igual spec Fase 1)

Mesmo `Invoice` com `scope=tenant` + `customerId`. Automação D-N (Fase 4) só enxerga faturas `scope=tenant`.

Após `PaymentConfirmed` (tenant scope) → evento → `renewals` cria `server_renewal_task`.

**Plataforma:** pagamento confirmado **não** cria renovação de servidor — apenas mantém tenant ativo.

---

## UI espelhada (mesmos padrões)

| Tela tenant (Fase 3) | Tela admin (Fase 2.5) |
|----------------------|------------------------|
| `/invoices` | `/admin/invoices` |
| `/payments` | `/admin/payments` |
| Detalhe cliente → aba pagamentos | Detalhe conta → aba faturas SaaS |
| Copiar PIX + toast (P0.5) | Idem |
| `PageLayout` + busca + paginação | Idem |

Componentes reutilizáveis em `shared/ui/billing/`:

- `InvoiceStatusBadge`
- `InvoiceCard` / lista
- `CopyPixButton`

---

## Módulos backend (estrutura)

```
apps/api/src/modules/billing/
├── index.ts
├── billing.routes.ts          # tenant routes (/api/invoices)
├── platform-billing.routes.ts # admin routes (/api/admin/invoices)
├── invoice.service.ts
├── payment.service.ts
└── billing.events.ts          # PaymentConfirmed

apps/api/src/integrations/payment/
├── payment-provider.interface.ts
├── asaas.provider.ts
└── payment-provider.factory.ts

apps/api/src/jobs/
└── platform-monthly-billing.job.ts
```

**Regra:** `customers` não importa `billing` diretamente — usar eventos ou chamadas via app orchestrator.

---

## Fases de entrega (recorte)

### Fase 2.5 — MVP plataforma (2–3 sprints)

1. Migrations `PlatformPlan`, `PlatformPaymentConfig`, `AccountSubscription`, `Invoice`, `Payment`
2. `PaymentProvider` + webhook platform
3. **`/admin/settings`** — preço SaaS + provider PIX plataforma
4. **`/settings`** (tenant) — provider PIX revenda + seção **Minha assinatura** (preço SaaS read-only)
5. Admin: assign plano à conta, listar faturas, botão “Gerar fatura do mês”
6. Job mensal + suspensão por inadimplência (configurável)

### Fase 3 — MVP tenant

1. `tenant_payment_config` + webhook por slug
2. CRUD fatura manual + automática por cliente
3. Front `/invoices`, `/payments`, P1.6 aba no cliente

### Depois

- Fase 4: automação + WhatsApp (só `scope=tenant`)
- Fase 5: renewals

---

## Perguntas em aberto (fechar com produto)

1. **Preço SaaS:** um único valor em Configurações admin ou vários `PlatformPlan` (Starter/Pro)?
2. **Cobrança por uso:** contar `customers` ativos e cobrar variável? (ex.: R$ base + R$ por cliente)
3. **Trial:** conta nova tem 7 dias sem fatura?
4. **Tenant vê fatura SaaS** no app dele ou só recebe e-mail/WhatsApp?
5. **Nota fiscal:** fora do escopo MVP (só controle interno + PIX)?

---

## Prompt Cursor (quando for implementar)

> Implemente Fase 2.5 conforme docs/iptv-manager/10-billing-dual-layer.md: migrations Invoice/Payment com BillingScope, módulo billing, Asaas platform config, webhook idempotente, rotas admin /api/admin/invoices, job mensal. Reutilize PageLayout, usePaginatedList e padrão PIX da doc 03. Não acople customers ao billing — use eventos.

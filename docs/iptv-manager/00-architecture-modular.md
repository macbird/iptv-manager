# Arquitetura modular (anti-monolito)

## Monorepo

```
client-manager/
├── apps/
│   ├── api/                    # Backend Node
│   ├── web/                    # Frontend revendedor (PWA)
│   └── (admin em apps/web)     # /admin/* — Fase 2 + Fase 2.5 (faturas SaaS)
├── packages/
│   ├── shared/                 # Zod schemas, enums, tipos API
│   └── eslint-config/          # opcional
├── docs/client-manager/          # Este guia
├── docker-compose.yml
├── docker-compose.prod.yml
└── package.json                # workspaces (pnpm ou npm)
```

**Limite de tamanho orientativo:** arquivo &lt; 300 linhas; pasta de feature com mais de 15 arquivos → subdividir.

---

## Backend (`apps/api`)

### Estrutura por módulo de domínio

```
apps/api/src/
├── main.ts                     # bootstrap: registra plugins globais
├── core/                       # cross-cutting (não é domínio)
│   ├── config/
│   ├── database/               # Prisma client singleton
│   ├── errors/
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── tenant-context.ts
│   │   └── error-handler.ts
│   └── queue/                  # BullMQ connection
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   ├── auth.schema.ts      # Zod
│   │   └── index.ts            # export registerAuthModule(app)
│   ├── customers/
│   ├── connections/
│   ├── plans/
│   ├── servers/
│   ├── billing/                # invoices, payments (scope: platform | tenant)
│   │   ├── invoice.service.ts
│   │   ├── billing.routes.ts           # /api/invoices (tenant)
│   │   └── platform-billing.routes.ts  # /api/admin/invoices (Fase 2.5)
│   ├── automation/             # billing_automation_config, jobs (só scope=tenant)
│   ├── renewals/               # server_renewal_task
│   ├── messaging/              # templates, whatsapp provider
│   ├── dashboard/
│   ├── reports/                # daily report, post-payment report
│   └── audit/
└── workers/
    ├── platform-monthly-billing.job.ts   # Fase 2.5 — faturas SaaS
    ├── billing-automation.worker.ts      # Fase 4 — só scope=tenant
    ├── daily-report.worker.ts
    └── message-sender.worker.ts
```

### Regras de dependência (backend)

| Pode importar | Não pode |
|---------------|----------|
| `core/*` | — |
| `modules/X` → `core`, `packages/shared` | `modules/customers` → `modules/billing` **direto** |
| Comunicação entre domínios | Service de outro módulo sem interface |

**Entre domínios:** usar **eventos** (ex.: `PaymentConfirmed`) ou **port/interface** injetada no bootstrap.

Exemplo: `billing` emite `PaymentConfirmed` → `renewals` escuta e cria `server_renewal_task` (**apenas** quando `invoice.scope = tenant`).

**Cobrança em duas camadas:** mesmo módulo `billing`, discriminador `BillingScope` (`platform` | `tenant`). Ver [10-billing-dual-layer.md](./10-billing-dual-layer.md).

### Registro Fastify (exemplo)

```typescript
// main.ts
await registerAuthModule(app);
await registerCustomersModule(app);
await registerBillingModule(app);
// cada index.ts registra apenas suas rotas + decorators
```

---

## Frontend (`apps/web`)

**Requisitos transversais:** PWA (`vite-plugin-pwa`) + **mobile-first**. Ver [06-pwa-responsive.md](./06-pwa-responsive.md).

```
apps/web/src/
├── app/                        # rotas, providers, layout shell
│   ├── layouts/AppShell.tsx    # sidebar (lg+) + drawer (mobile)
│   ├── router.tsx
│   └── providers.tsx
├── features/
│   ├── auth/
│   │   ├── pages/LoginPage.tsx
│   │   ├── pages/RegisterPage.tsx
│   │   ├── api/auth.api.ts
│   │   └── hooks/useAuth.ts
│   ├── customers/
│   ├── automation/
│   ├── renewals/
│   ├── dashboard/
│   ├── billing/                # /invoices, /payments (Fase 3)
│   └── settings/
├── features/admin/             # /admin/* — Fase 2 ✅; faturas SaaS Fase 2.5
├── shared/
│   ├── ui/
│   │   ├── lists/              # CardList, EntityCard, FilterSheet (OBRIGATÓRIO)
│   │   └── billing/            # InvoiceCard, CopyPixButton (Fase 2.5+3)
│   ├── api/
│   ├── hooks/
│   └── lib/
└── main.tsx
```

**Integrações PIX (compartilhadas — Fase 2.5 + 3):**

```
apps/api/src/integrations/payment/
├── payment-provider.interface.ts   # emv | checkout_link
├── asaas.provider.ts
├── infinitypay.provider.ts         # futuro — checkout_link
└── payment-provider.factory.ts   # credencial platform vs tenant
```

Webhooks: `POST /api/webhooks/payment/platform` e `POST /api/webhooks/payment/:tenantSlug/:provider` — ver [10-billing-dual-layer.md](./10-billing-dual-layer.md) e [03-integrations-pix-whatsapp.md](./03-integrations-pix-whatsapp.md).

### Regras (frontend)

- `features/*` **não** importam páginas de outra feature.
- Compartilhar via `shared/` ou `packages/shared` (tipos).
- API por feature: `customers.api.ts`, não um `api.ts` de 2000 linhas.
- **Listas:** usar `CardList` / `EntityCard` — **proibido** `<table>` como UI principal ([07-mobile-cards-ux.md](./07-mobile-cards-ux.md)).

---

## Packages/shared

```
packages/shared/src/
├── schemas/          # Zod: CustomerCreate, InvoiceResponse
├── enums/            # InvoiceStatus, BillingScope, RenewalStatus
└── constants/
```

Sem Prisma, sem Fastify, sem React — só contratos.

---

## Multi-tenant em todo módulo

Todo service de domínio recebe `tenantId` do contexto (JWT):

```typescript
// middleware seta request.tenantId
async listCustomers(tenantId: string, filters: ListFilters) {
  return prisma.customer.findMany({ where: { tenantId, ...filters } });
}
```

**Nunca** confiar em `tenant_id` vindo do body sem validar contra o JWT.

---

## Testes (por módulo)

```
modules/customers/
├── customers.service.ts
└── __tests__/customers.service.test.ts
```

Testar **services** com DB de teste ou mocks de repositório — não testar `main.ts` inteiro.

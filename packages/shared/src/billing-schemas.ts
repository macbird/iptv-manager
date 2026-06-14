import { z } from 'zod';
import { accountSlugSchema } from './account-slug';
import { INVOICE_KIND_VALUES } from './billing-enums';
import { chargeMessageSettingsSchema } from './charge-message';
import { nullableOptionalPhoneE164Schema, optionalPhoneE164Schema } from './phone-e164';

export const MANUAL_PAYMENT_METHOD_VALUES = ['pix', 'cash', 'transfer', 'other'] as const;
export type ManualPaymentMethodValue = (typeof MANUAL_PAYMENT_METHOD_VALUES)[number];

export const MANUAL_PAYMENT_METHOD_LABELS: Record<ManualPaymentMethodValue, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  other: 'Outro',
};

export const createManualInvoiceSchema = z
  .object({
    customerId: z.string().uuid(),
    amountCents: z.number().int().positive(),
    dueDate: z.string().min(1),
    kind: z.enum(INVOICE_KIND_VALUES).optional().default('subscription'),
    description: z.string().max(500).optional(),
    billingCycleKey: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Use o formato YYYY-MM')
      .optional(),
    chargeMessages: chargeMessageSettingsSchema.optional(),
    registerPayment: z.boolean().optional(),
    paymentMethod: z.enum(MANUAL_PAYMENT_METHOD_VALUES).optional(),
    paymentNotes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'one_off' && !data.description?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a descrição da cobrança avulsa',
        path: ['description'],
      });
    }
  });

export type CreateManualInvoiceInput = z.infer<typeof createManualInvoiceSchema>;

export const registerPaymentSchema = z.object({
  method: z.enum(MANUAL_PAYMENT_METHOD_VALUES),
  notes: z.string().max(500).optional(),
  paidAt: z.string().optional(),
});

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;

export const ACTIVATION_STATUS_VALUES = ['pending', 'completed', 'cancelled'] as const;
export type ActivationStatusInputValue = (typeof ACTIVATION_STATUS_VALUES)[number];

export const updateActivationStatusSchema = z.object({
  status: z.enum(ACTIVATION_STATUS_VALUES),
  notes: z.string().max(500).optional(),
});

export type UpdateActivationStatusInput = z.infer<typeof updateActivationStatusSchema>;

/** SaaS platform plans are monthly-only by product policy. */
export const PLATFORM_PLAN_BILLING_CYCLE_VALUES = ['monthly'] as const;
export type PlatformPlanBillingCycleValue = (typeof PLATFORM_PLAN_BILLING_CYCLE_VALUES)[number];

export const platformPlanSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do plano'),
  priceCents: z.number().int().min(0, 'Informe um preço válido'),
  billingCycle: z.literal('monthly').default('monthly'),
  maxCustomers: z.number().int().positive().nullable().optional(),
  active: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export type PlatformPlanInput = z.infer<typeof platformPlanSchema>;

export const createTenantAccountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  slug: accountSlugSchema,
  ownerName: z.string().min(1, 'Nome do proprietário é obrigatório'),
  ownerEmail: z.string().email('Informe um e-mail válido'),
  initialPassword: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  ),
  dueDate: z.string().min(1, 'Informe a data de vencimento'),
  platformPlanId: z.string().uuid().optional(),
  phone: optionalPhoneE164Schema,
});

export type CreateTenantAccountInput = z.infer<typeof createTenantAccountSchema>;

export const updateTenantAccountSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  dueDate: z.string().min(1).optional(),
  platformPlanId: z.string().uuid().optional(),
  phone: nullableOptionalPhoneE164Schema,
});

export type UpdateTenantAccountInput = z.infer<typeof updateTenantAccountSchema>;

import { z } from 'zod';
import { ENABLED_PAYMENT_PROVIDER_VALUES } from './billing-enums';
import { CUSTOMER_STATUS_VALUES } from './customer-status';
import { CustomerStatus } from './enums';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  accountName: z.string().min(3),
  userName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const planSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do plano'),
  description: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().optional(),
  ),
  price: z.coerce.number().min(0, 'Informe um preço válido'),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Selecione o ciclo de cobrança' }),
  }),
  maxConnections: z.coerce.number().int().min(1, 'Informe ao menos 1 conexão'),
  extraConnectionPrice: z.preprocess(
    (v) => (v === null || v === undefined || v === '' ? 0 : v),
    z.coerce.number().min(0).default(0),
  ),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type PlanInput = z.infer<typeof planSchema>;

export const serverSchema = z.object({
  name: z.string().min(1),
  panelUrl: z.string().url(),
  panelUsername: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : String(val).trim()),
    z.string().min(1, 'Informe o usuário do painel').optional(),
  ),
  panelPassword: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
    z.string().optional(),
  ),
  panelNotes: z.string().optional(),
  maxConnections: z.number().int().min(1).optional(),
  status: z.enum(['active', 'maintenance', 'full', 'inactive']).default('active'),
});

export type ServerInput = z.infer<typeof serverSchema>;

export const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export type TagInput = z.infer<typeof tagSchema>;

export const connectionSchema = z.object({
  serverId: z.string().uuid('Selecione o servidor'),
  macAddress: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'MAC inválido'),
  applicationName: z.string().min(1, 'Aplicativo obrigatório'),
  label: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
    z.string().optional(),
  ),
  m3u8Link: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : String(val).trim()),
    z.string().url('Informe um link M3U8 válido').optional(),
  ),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do cliente'),
  email: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? '' : String(val)),
    z.string().email('E-mail inválido').optional().or(z.literal('')),
  ),
  phone: z.preprocess(
    (val) => String(val ?? '').replace(/\D/g, ''),
    z.string().min(10, 'Informe um telefone válido com DDD'),
  ),
  status: z.enum(CUSTOMER_STATUS_VALUES).default(CustomerStatus.ACTIVE),
  tagIds: z.array(z.string().uuid()).optional(),
  planId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().uuid().optional(),
  ),
  notes: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
    z.string().optional(),
  ),
  expiresAt: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (val instanceof Date) return val;
    return new Date(val as string);
  }, z.date().optional()),
  connections: z
    .array(connectionSchema)
    .min(1, 'Adicione ao menos uma conexão'),
});

export type CustomerInput = z.infer<typeof customerSchema>;

const paymentProviderEnum = z.enum(ENABLED_PAYMENT_PROVIDER_VALUES);

export const tenantPaymentCredentialSchema = z.object({
  provider: paymentProviderEnum,
  apiKey: z.string().optional(),
  webhookToken: z.string().optional(),
  active: z.boolean().optional(),
});

export const tenantPaymentRoutingRuleSchema = z.object({
  minAmountCents: z.number().int().min(0),
  provider: paymentProviderEnum,
  active: z.boolean().optional(),
});

export const updateTenantPaymentCredentialsSchema = z.object({
  credentials: z.array(tenantPaymentCredentialSchema).min(1),
});

export const updateTenantPaymentRoutingSchema = z.object({
  rules: z.array(tenantPaymentRoutingRuleSchema).min(1),
});

export type UpdateTenantPaymentCredentialsInput = z.infer<
  typeof updateTenantPaymentCredentialsSchema
>;
export type UpdateTenantPaymentRoutingInput = z.infer<typeof updateTenantPaymentRoutingSchema>;

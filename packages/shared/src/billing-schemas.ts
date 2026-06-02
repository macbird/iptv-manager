import { z } from 'zod';

export const MANUAL_PAYMENT_METHOD_VALUES = ['pix', 'cash', 'transfer', 'other'] as const;
export type ManualPaymentMethodValue = (typeof MANUAL_PAYMENT_METHOD_VALUES)[number];

export const MANUAL_PAYMENT_METHOD_LABELS: Record<ManualPaymentMethodValue, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  other: 'Outro',
};

export const createManualInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  dueDate: z.string().min(1),
  billingCycleKey: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Use o formato YYYY-MM')
    .optional(),
  registerPayment: z.boolean().optional(),
  paymentMethod: z.enum(MANUAL_PAYMENT_METHOD_VALUES).optional(),
  paymentNotes: z.string().max(500).optional(),
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

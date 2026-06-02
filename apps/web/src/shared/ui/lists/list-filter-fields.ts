import {
  BILLING_INVOICE_STATUS_LABELS,
  BILLING_INVOICE_STATUS_VALUES,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_VALUES,
} from '@client-manager/shared';
import type { ListFilterFieldDef } from './ListFiltersModal';

const PLAN_STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'archived', label: 'Arquivado' },
];

const SERVER_STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'full', label: 'Lotado' },
];

const BILLING_CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'pix', label: 'PIX' },
  { value: 'manual', label: 'Manual' },
];

export const CUSTOMER_FILTER_FIELDS: ListFilterFieldDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: CUSTOMER_STATUS_VALUES.map((value) => ({
      value,
      label: CUSTOMER_STATUS_LABELS[value],
    })),
  },
  {
    key: 'planId',
    label: 'Plano',
    type: 'select',
    options: [],
  },
  {
    key: 'expiresFrom',
    label: 'Vencimento a partir de',
    type: 'date',
  },
  {
    key: 'expiresTo',
    label: 'Vencimento até',
    type: 'date',
  },
];

export const PLAN_FILTER_FIELDS: ListFilterFieldDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: PLAN_STATUS_OPTIONS,
  },
  {
    key: 'billingCycle',
    label: 'Ciclo de cobrança',
    type: 'select',
    options: BILLING_CYCLE_OPTIONS,
  },
  {
    key: 'minPrice',
    label: 'Preço mínimo (R$)',
    type: 'number',
    placeholder: 'Ex.: 29.90',
  },
  {
    key: 'maxPrice',
    label: 'Preço máximo (R$)',
    type: 'number',
    placeholder: 'Ex.: 99.90',
  },
];

export const SERVER_FILTER_FIELDS: ListFilterFieldDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: SERVER_STATUS_OPTIONS,
  },
];

export const INVOICE_FILTER_FIELDS: ListFilterFieldDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: BILLING_INVOICE_STATUS_VALUES.map((value) => ({
      value,
      label: BILLING_INVOICE_STATUS_LABELS[value],
    })),
  },
  {
    key: 'billingCycleKey',
    label: 'Ciclo (mês)',
    type: 'month',
  },
  {
    key: 'dueFrom',
    label: 'Vencimento a partir de',
    type: 'date',
  },
  {
    key: 'dueTo',
    label: 'Vencimento até',
    type: 'date',
  },
];

export const ACTIVATION_FILTER_FIELDS: ListFilterFieldDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pending', label: 'Pendente' },
      { value: 'completed', label: 'Concluída' },
      { value: 'cancelled', label: 'Cancelada' },
    ],
  },
];

export const PAYMENT_FILTER_FIELDS: ListFilterFieldDef[] = [
  {
    key: 'method',
    label: 'Método',
    type: 'select',
    options: PAYMENT_METHOD_OPTIONS,
  },
  {
    key: 'billingCycleKey',
    label: 'Ciclo da fatura',
    type: 'month',
  },
  {
    key: 'paidFrom',
    label: 'Pago a partir de',
    type: 'date',
  },
  {
    key: 'paidTo',
    label: 'Pago até',
    type: 'date',
  },
];

export function withPlanOptions(
  fields: ListFilterFieldDef[],
  plans: Array<{ id: string; name: string }>,
): ListFilterFieldDef[] {
  return fields.map((field) =>
    field.key === 'planId'
      ? {
          ...field,
          options: plans.map((plan) => ({ value: plan.id, label: plan.name })),
        }
      : field,
  );
}

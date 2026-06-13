import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  ACCOUNT_SLUG_FIELD_HINT,
  ACCOUNT_SLUG_FIELD_LABEL,
  createTenantAccountSchema,
  nullableOptionalPhoneE164Schema,
} from '@client-manager/shared';
import { z } from 'zod';
import { Building2, Calendar, Link2, Mail, Package, Phone, ToggleLeft, User } from 'lucide-react';
import { platformPlansApi } from '../api/platform-plans.api';
import { FormInput } from '../../../shared/ui/forms/FormInput';
import { FormPasswordInput } from '../../../shared/ui/forms/FormPasswordInput';
import { FormSelect } from '../../../shared/ui/forms/FormSelect';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { showToast } from '../../../shared/utils/toast';

export interface AccountCreateInput {
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  initialPassword?: string;
  dueDate: string;
  platformPlanId?: string;
  phone?: string;
}

export interface AccountEditInput {
  status: 'active' | 'inactive';
  dueDate: string;
  platformPlanId?: string;
  phone?: string | null;
}

const accountEditFormSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  dueDate: z.string().min(1, 'Informe a data de vencimento'),
  platformPlanId: z.string().uuid('Selecione um plano'),
  phone: nullableOptionalPhoneE164Schema,
});

function suggestedDueDateValue(): string {
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();
  if (now.getDate() > 10) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return `${year}-${String(month + 1).padStart(2, '0')}-10`;
}

function toDateInputValue(isoDate?: string | null): string {
  if (!isoDate) return suggestedDueDateValue();
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return suggestedDueDateValue();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

type AccountFormProps = {
  formId: string;
} & (
  | {
      mode: 'create';
      onSubmit: (data: AccountCreateInput) => Promise<void>;
      initialData?: never;
    }
  | {
      mode: 'edit';
      onSubmit: (data: AccountEditInput) => Promise<void>;
      initialData?: {
        id?: string;
        name?: string;
        slug?: string;
        status?: 'active' | 'inactive';
        subscription?: {
          nextDueDate?: string;
          platformPlan?: { id: string; name: string; priceCents: number };
        } | null;
        phone?: string | null;
        users?: Array<{ name?: string; email?: string; role?: string }>;
      };
    }
);

export const AccountForm: React.FC<AccountFormProps> = ({
  formId,
  mode,
  onSubmit,
  initialData,
}) => {
  const { data: platformPlansData, isLoading: platformPlansLoading } = useQuery({
    queryKey: ['platform-plans', 'selectable'],
    queryFn: () =>
      platformPlansApi.list({
        page: 1,
        pageSize: 100,
        filter: '',
        selectableOnly: true,
      }),
  });

  const platformPlans = platformPlansData?.data ?? [];
  const defaultPlatformPlanId =
    platformPlans.find((plan) => plan.isDefault)?.id ?? platformPlans[0]?.id ?? '';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver:
      mode === 'create'
        ? zodResolver(createTenantAccountSchema)
        : zodResolver(accountEditFormSchema),
    defaultValues: {
      dueDate: suggestedDueDateValue(),
      platformPlanId: defaultPlatformPlanId,
    },
  });

  React.useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name ?? '',
        slug: initialData.slug ?? '',
        status: initialData.status ?? 'active',
        dueDate: toDateInputValue(initialData.subscription?.nextDueDate),
        platformPlanId: initialData.subscription?.platformPlan?.id ?? defaultPlatformPlanId,
        phone: initialData.phone ?? '',
      });
      return;
    }

    if (mode === 'create' && defaultPlatformPlanId) {
      reset((current) => ({
        ...current,
        platformPlanId: current.platformPlanId || defaultPlatformPlanId,
      }));
    }
  }, [mode, initialData, reset, defaultPlatformPlanId]);

  const onInvalid = () => {
    showToast.error('Revise os campos destacados antes de continuar');
  };

  const onSubmitHandler = handleSubmit(async (data) => {
    if (mode === 'create') {
      await onSubmit({
        name: data.name,
        slug: data.slug,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        initialPassword: data.initialPassword || undefined,
        dueDate: data.dueDate,
        platformPlanId: data.platformPlanId || undefined,
        phone: data.phone?.trim() || undefined,
      });
      return;
    }
    await onSubmit({
      status: data.status,
      dueDate: data.dueDate,
      platformPlanId: data.platformPlanId || undefined,
      phone: data.phone?.trim() || null,
    });
  }, onInvalid);

  const platformPlanField = platformPlansLoading ? (
    <div className="relative h-16">
      <LoadingSpinner />
    </div>
  ) : (
    <FormSelect
      label="Plano"
      prefixIcon={Package}
      hint="Valor usado nas faturas desta revenda."
      {...register('platformPlanId', { required: 'Selecione um plano' })}
    >
      {platformPlans.length === 0 ? (
        <option value="">Nenhum plano ativo</option>
      ) : (
        platformPlans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name} — R$ {(plan.priceCents / 100).toFixed(2)}/mês
            {plan.isDefault ? ' (padrão)' : ''}
          </option>
        ))
      )}
    </FormSelect>
  );

  const phoneField = (
    <FormInput
      label="Telefone (notificações / cobrança)"
      prefixIcon={Phone}
      placeholder="(11) 99999-9999"
      error={errors.phone?.message ? String(errors.phone.message) : undefined}
      {...register('phone')}
    />
  );

  const dueDateField = (
    <FormInput
      label="Próximo vencimento"
      type="date"
      prefixIcon={Calendar}
      error={errors.dueDate?.message ? String(errors.dueDate.message) : undefined}
      hint={
        errors.dueDate
          ? undefined
          : 'Usada para gerar a fatura da plataforma nesta data.'
      }
      {...register('dueDate', { required: 'Informe a data de vencimento' })}
    />
  );

  if (mode === 'edit') {
    return (
      <form id={formId} noValidate onSubmit={onSubmitHandler} className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{initialData?.name}</span>
          {initialData?.slug ? (
            <>
              <span className="mx-2 text-slate-300">·</span>
              <span className="font-mono text-xs">{initialData.slug}</span>
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {platformPlanField}
          {dueDateField}
          {phoneField}
          <FormSelect
            label="Status da conta"
            prefixIcon={ToggleLeft}
            hint="Contas suspensas não conseguem fazer login no app do revendedor."
            {...register('status', { required: true })}
          >
            <option value="active">Ativa</option>
            <option value="inactive">Desativada</option>
          </FormSelect>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            label="Nome da conta"
            prefixIcon={Building2}
            disabled
            className="cursor-not-allowed opacity-80"
            {...register('name')}
          />
          <FormInput
            label={ACCOUNT_SLUG_FIELD_LABEL}
            prefixIcon={Link2}
            disabled
            className="cursor-not-allowed font-mono opacity-80"
            hint="Definido na criação da conta; não pode ser alterado depois."
            {...register('slug')}
          />
        </div>

        {initialData?.users && initialData.users.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-sm font-medium text-slate-900">Usuários da conta</h3>
            <ul className="space-y-2">
              {initialData.users.map((user, index) => (
                <li
                  key={`${user.email}-${index}`}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-900">{user.name}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-600">{user.email}</span>
                  {user.role ? (
                    <span className="ml-2 text-xs text-slate-400">({user.role})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    );
  }

  return (
    <form id={formId} noValidate onSubmit={onSubmitHandler} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInput
          label="Nome da empresa/revenda"
          prefixIcon={Building2}
          error={errors.name?.message ? String(errors.name.message) : undefined}
          placeholder="Ex: Revenda Master"
          {...register('name', { required: 'Nome da conta é obrigatório' })}
        />
        <FormInput
          label={ACCOUNT_SLUG_FIELD_LABEL}
          prefixIcon={Link2}
          placeholder="ex: revenda-master"
          error={errors.slug?.message ? String(errors.slug.message) : undefined}
          hint={errors.slug ? undefined : ACCOUNT_SLUG_FIELD_HINT}
          className="font-mono"
          {...register('slug')}
        />
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="mb-4 text-sm font-medium text-slate-900">Cobrança</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {platformPlanField}
          <div className="max-w-xs">{dueDateField}</div>
          {phoneField}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="mb-4 text-sm font-medium text-slate-900">Dados do proprietário</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            label="Nome do usuário"
            prefixIcon={User}
            error={errors.ownerName?.message ? String(errors.ownerName.message) : undefined}
            placeholder="Ex: João Silva"
            {...register('ownerName', { required: 'Nome do proprietário é obrigatório' })}
          />
          <FormInput
            label="E-mail de acesso"
            type="email"
            prefixIcon={Mail}
            error={errors.ownerEmail?.message ? String(errors.ownerEmail.message) : undefined}
            placeholder="joao@email.com"
            {...register('ownerEmail', {
              required: 'E-mail de acesso é obrigatório',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Informe um e-mail válido',
              },
            })}
          />
        </div>

        <div className="mt-4 max-w-md">
          <FormPasswordInput
            label="Senha inicial (opcional)"
            autoComplete="new-password"
            placeholder="Mudar123! (padrão se vazio)"
            hint="O usuário será obrigado a trocar esta senha no primeiro login."
            error={errors.initialPassword?.message as string | undefined}
            {...register('initialPassword', {
              validate: (value) =>
                !value ||
                String(value).length >= 6 ||
                'Senha deve ter no mínimo 6 caracteres',
            })}
          />
        </div>
      </div>
    </form>
  );
};

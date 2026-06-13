import React from 'react';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { platformPlanSchema, type PlatformPlanInput } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';
import { Package, ToggleLeft } from 'lucide-react';
import { FormCurrencyInput } from '../../../shared/ui/forms/FormCurrencyInput';
import { FormInput } from '../../../shared/ui/forms/FormInput';
import { FormSelect } from '../../../shared/ui/forms/FormSelect';
import { formRootClass, formSectionClass } from '../../../shared/ui/forms/form-styles';

interface PlatformPlanFormProps {
  formId: string;
  onSubmit: (data: PlatformPlanInput) => Promise<void>;
  initialData?: Partial<PlatformPlanInput>;
}

function sanitizePlatformPlanForForm(plan: Partial<PlatformPlanInput>): PlatformPlanInput {
  return {
    name: plan.name ?? '',
    priceCents: Number(plan.priceCents) || 0,
    billingCycle: 'monthly',
    maxCustomers: plan.maxCustomers ?? null,
    active: plan.active ?? true,
    isDefault: plan.isDefault ?? false,
  };
}

export const PlatformPlanForm: React.FC<PlatformPlanFormProps> = ({
  formId,
  onSubmit,
  initialData,
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PlatformPlanInput>({
    resolver: zodResolver(platformPlanSchema),
    defaultValues: sanitizePlatformPlanForForm({}),
  });

  React.useEffect(() => {
    if (initialData) {
      reset(sanitizePlatformPlanForForm(initialData));
    }
  }, [initialData, reset]);

  const onSubmitWrapper = async (data: PlatformPlanInput) => {
    await onSubmit({
      ...data,
      name: data.name.trim(),
      billingCycle: 'monthly',
      maxCustomers: data.maxCustomers ?? null,
    });
  };

  const onInvalid = (fieldErrors: FieldErrors<PlatformPlanInput>) => {
    const firstError = Object.values(fieldErrors)[0];
    showToast.error(firstError?.message?.toString() ?? 'Verifique os campos do formulário.');
  };

  const isDefault = watch('isDefault');

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSubmit(onSubmitWrapper, onInvalid)}
      className={`${formSectionClass} ${formRootClass}`}
    >
      <FormInput
        label="Nome"
        prefixIcon={Package}
        error={errors.name?.message}
        placeholder="Ex: Starter, Pro, Enterprise"
        {...register('name')}
      />

      <Controller
        name="priceCents"
        control={control}
        render={({ field }) => (
          <FormCurrencyInput
            label="Valor mensal"
            error={errors.priceCents?.message}
            value={field.value / 100}
            onChange={(value) => field.onChange(Math.round((value ?? 0) * 100))}
            onBlur={field.onBlur}
            ref={field.ref}
          />
        )}
      />

      <p className="text-xs text-slate-500">Planos são sempre cobrados mensalmente.</p>

      <FormInput
        label="Limite de clientes (opcional)"
        type="number"
        min={1}
        error={errors.maxCustomers?.message}
        placeholder="Sem limite"
        {...register('maxCustomers', {
          setValueAs: (value) => {
            if (value === '' || value === null || value === undefined) return null;
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
          },
        })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          label="Status"
          prefixIcon={ToggleLeft}
          {...register('active', {
            setValueAs: (value) => value === 'true' || value === true,
          })}
        >
          <option value="true">Ativo</option>
          <option value="false">Desativado</option>
        </FormSelect>

        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input type="checkbox" className="rounded border-slate-300" {...register('isDefault')} />
          Plano padrão para novas contas
        </label>
      </div>

      {isDefault ? (
        <p className="text-xs text-slate-500">
          Novas contas sem plano selecionado usarão este plano automaticamente.
        </p>
      ) : null}
    </form>
  );
};

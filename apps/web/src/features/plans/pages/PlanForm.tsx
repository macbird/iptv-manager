import React from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { planSchema, type PlanInput } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';

interface PlanFormProps {
  onSubmit: (data: PlanInput) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<PlanInput>;
}

function sanitizePlanForForm(plan: Partial<PlanInput>): PlanInput {
  return {
    name: plan.name ?? '',
    description: plan.description ?? '',
    price: Number(plan.price) || 0,
    billingCycle: plan.billingCycle ?? 'monthly',
    maxConnections: Number(plan.maxConnections) || 1,
    extraConnectionPrice:
      plan.extraConnectionPrice != null ? Number(plan.extraConnectionPrice) : 0,
    status: plan.status ?? 'active',
  };
}

export const PlanForm = React.forwardRef<HTMLFormElement, PlanFormProps>(
  ({ onSubmit, onCancel, initialData }, ref) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<PlanInput>({
      resolver: zodResolver(planSchema),
      defaultValues: {
        billingCycle: 'monthly',
        maxConnections: 1,
        status: 'active',
        name: '',
        description: '',
        price: 0,
        extraConnectionPrice: 0,
      },
    });

    React.useEffect(() => {
      if (initialData) {
        reset(sanitizePlanForForm(initialData));
      }
    }, [initialData, reset]);

    const onSubmitWrapper = async (data: PlanInput) => {
      await onSubmit({
        ...data,
        extraConnectionPrice: data.extraConnectionPrice ?? 0,
      });
    };

    const onInvalid = (fieldErrors: FieldErrors<PlanInput>) => {
      const firstError = Object.values(fieldErrors)[0];
      showToast.error(
        firstError?.message?.toString() ?? 'Verifique os campos do formulário.',
      );
    };

    return (
      <form
        ref={ref}
        id="plan-form"
        onSubmit={handleSubmit(onSubmitWrapper, onInvalid)}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">Nome</label>
          <input
            {...register('name')}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            {...register('description')}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Ciclo</label>
            <select
              {...register('billingCycle')}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            >
              <option value="monthly">Mensal</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
            </select>
            {errors.billingCycle && (
              <p className="text-red-500 text-xs mt-1">{errors.billingCycle.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Conexões</label>
            <input
              type="number"
              {...register('maxConnections', { valueAsNumber: true })}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            />
            {errors.maxConnections && (
              <p className="text-red-500 text-xs mt-1">{errors.maxConnections.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              {...register('status')}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            >
              <option value="active">Ativo</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
        </div>
      </form>
    );
  },
);

PlanForm.displayName = 'PlanForm';

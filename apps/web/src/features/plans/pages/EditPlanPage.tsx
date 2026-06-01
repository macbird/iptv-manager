import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { plansApi } from '../api/plans.api';
import { PlanForm } from './PlanForm';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import type { PlanInput } from '@client-manager/shared';

function sanitizePlanForForm(plan: Record<string, unknown>): PlanInput {
  return {
    name: (plan.name as string) ?? '',
    description: (plan.description as string) ?? '',
    price: Number(plan.price) || 0,
    billingCycle: (plan.billingCycle as PlanInput['billingCycle']) ?? 'monthly',
    maxConnections: Number(plan.maxConnections) || 1,
    extraConnectionPrice:
      plan.extraConnectionPrice != null ? Number(plan.extraConnectionPrice) : 0,
    status: (plan.status as PlanInput['status']) ?? 'active',
  };
}

export const EditPlanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formRef = React.useRef<HTMLFormElement>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plans', id],
    queryFn: () => plansApi.getById(id!),
    enabled: !!id,
  });

  const initialData = React.useMemo(
    () => (plan ? sanitizePlanForForm(plan as Record<string, unknown>) : undefined),
    [plan],
  );

  const { update, isUpdating } = useCrud<unknown, PlanInput>({
    queryKey: ['plans'],
    updateFn: plansApi.update,
    listPath: '/plans',
    entityName: 'Plano',
  });

  if (isLoading) {
    return (
      <div className="relative h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageLayout
      title="Editar Plano"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/plans')}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => formRef.current?.requestSubmit()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isUpdating ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      }
    >
      <PlanForm
        ref={formRef}
        initialData={initialData}
        onSubmit={async (data) => await update(id!, data)}
        onCancel={() => navigate('/plans')}
      />
    </PageLayout>
  );
};

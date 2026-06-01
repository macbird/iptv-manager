import React from 'react';
import { useNavigate } from 'react-router-dom';
import { plansApi } from '../api/plans.api';
import { PlanForm } from './PlanForm';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { PlanInput } from '@client-manager/shared';

export const CreatePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { create } = useCrud<any, PlanInput>({
    queryKey: ['plans'],
    createFn: plansApi.create,
    listPath: '/plans',
    entityName: 'Plano',
  });

  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <PageLayout
      title="Novo Plano"
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
            onClick={() => formRef.current?.requestSubmit()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Salvar
          </button>
        </div>
      }
    >
      <PlanForm 
        ref={formRef}
        onSubmit={async (data) => await create(data)} 
        onCancel={() => navigate('/plans')} 
      />
    </PageLayout>
  );
};

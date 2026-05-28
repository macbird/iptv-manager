import React from 'react';
import { useNavigate } from 'react-router-dom';
import { plansApi } from '../api/plans.api';
import { PlanForm } from './PlanForm';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { PlanInput } from '@iptv-manager/shared';

export const CreatePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { create, isCreating } = useCrud<any, PlanInput>({
    queryKey: ['plans'],
    createFn: plansApi.create,
    listPath: '/plans',
    entityName: 'Plano',
  });

  return (
    <FormLayout title="Novo Plano">
      <PlanForm 
        onSubmit={async (data) => await create(data)} 
        onCancel={() => navigate('/plans')} 
      />
    </FormLayout>
  );
};

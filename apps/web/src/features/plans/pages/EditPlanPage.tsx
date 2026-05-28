import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { plansApi } from '../api/plans.api';
import { PlanForm } from './PlanForm';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { PlanInput } from '@iptv-manager/shared';

export const EditPlanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plans', id],
    queryFn: () => plansApi.list().then(plans => plans.find((p: any) => p.id === id)),
  });

  const { update } = useCrud<any, PlanInput>({
    queryKey: ['plans'],
    updateFn: plansApi.update,
    listPath: '/plans',
    entityName: 'Plano',
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <FormLayout title="Editar Plano">
      <PlanForm 
        initialData={plan}
        onSubmit={async (data) => await update(id!, data)} 
        onCancel={() => navigate('/plans')} 
      />
    </FormLayout>
  );
};

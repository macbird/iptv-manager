import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import { CustomerForm } from './CustomerForm';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { CustomerInput } from '@iptv-manager/shared';

export const EditCustomerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.list().then(customers => customers.find((c: any) => c.id === id)),
  });

  const { update } = useCrud<any, CustomerInput>({
    queryKey: ['customers'],
    updateFn: customersApi.update,
    listPath: '/customers',
    entityName: 'Cliente',
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <FormLayout title="Editar Cliente">
      <CustomerForm 
        initialData={customer}
        onSubmit={async (data) => await update(id!, data)} 
        onCancel={() => navigate('/customers')} 
      />
    </FormLayout>
  );
};

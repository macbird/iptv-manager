import React from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../api/customers.api';
import { CustomerForm } from './CustomerForm';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { CustomerInput } from '@iptv-manager/shared';

export const CreateCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { create } = useCrud<any, CustomerInput>({
    queryKey: ['customers'],
    createFn: customersApi.create,
    listPath: '/customers',
    entityName: 'Cliente',
  });

  return (
    <FormLayout title="Novo Cliente">
      <CustomerForm 
        onSubmit={async (data) => await create(data)} 
        onCancel={() => navigate('/customers')} 
      />
    </FormLayout>
  );
};

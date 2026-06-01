import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import { CustomerForm } from './CustomerForm';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import type { CustomerInput } from '@client-manager/shared';

export const EditCustomerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.getById(id!),
  });

  const { update, isUpdating } = useCrud<any, CustomerInput>({
    queryKey: ['customers'],
    updateFn: customersApi.update,
    listPath: '/customers',
    entityName: 'Cliente',
  });

  const formRef = React.useRef<HTMLFormElement>(null);

  if (isLoading) return <div className="relative h-64"><LoadingSpinner /></div>;

  return (
    <PageLayout
      title="Editar Cliente"
      noPadding={false}
      footer={
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isUpdating ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      }
    >
      <CustomerForm 
        ref={formRef}
        initialData={customer}
        onSubmit={async (data) => await update(id!, data)} 
        onCancel={() => navigate('/customers')} 
      />
    </PageLayout>
  );
};

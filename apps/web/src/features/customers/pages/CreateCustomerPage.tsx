import React from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../api/customers.api';
import { CustomerForm } from './CustomerForm';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { CustomerInput } from '@client-manager/shared';

export const CreateCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { create } = useCrud<any, any>({
    queryKey: ['customers'],
    createFn: customersApi.create,
    listPath: '/customers',
    entityName: 'Cliente',
  });

  // We need a ref to the form to trigger submit from the footer button
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <PageLayout
      title="Novo Cliente"
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
            onClick={() => formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Salvar
          </button>
        </div>
      }
    >
      <CustomerForm 
        ref={formRef}
        onSubmit={async (data) => {
            await create(data);
        }} 
        onCancel={() => navigate('/customers')} 
      />
    </PageLayout>
  );
};

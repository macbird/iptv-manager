import React from 'react';
import { useNavigate } from 'react-router-dom';
import { serversApi } from '../api/servers.api';
import { ServerForm } from './ServerForm';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { ServerInput } from '@client-manager/shared';

export const CreateServerPage: React.FC = () => {
  const navigate = useNavigate();
  const { create } = useCrud<any, ServerInput>({
    queryKey: ['servers'],
    createFn: serversApi.create,
    listPath: '/servers',
    entityName: 'Servidor',
  });

  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <PageLayout
      title="Novo Servidor"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/servers')}
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
      <ServerForm 
        ref={formRef}
        onSubmit={async (data) => await create(data)} 
        onCancel={() => navigate('/servers')} 
      />
    </PageLayout>
  );
};

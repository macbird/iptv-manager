import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { serversApi } from '../api/servers.api';
import { ServerForm } from './ServerForm';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import type { ServerInput } from '@client-manager/shared';

export const EditServerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: () => serversApi.list({ page: 1, pageSize: 100, filter: '' }),
  });

  const server = data?.data.find((s: any) => s.id === id);

  const { update, isUpdating } = useCrud<any, ServerInput>({
    queryKey: ['servers'],
    updateFn: serversApi.update,
    listPath: '/servers',
    entityName: 'Servidor',
  });

  const formRef = React.useRef<HTMLFormElement>(null);

  if (isLoading) return <div className="relative h-64"><LoadingSpinner /></div>;

  return (
    <PageLayout
      title="Editar Servidor"
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
            disabled={isUpdating}
            onClick={() => formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isUpdating ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      }
    >
      <ServerForm 
        ref={formRef}
        initialData={server}
        onSubmit={async (data) => await update(id!, data)} 
        onCancel={() => navigate('/servers')} 
      />
    </PageLayout>
  );
};

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { serversApi } from '../api/servers.api';
import { ServerForm } from './ServerForm';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { ServerInput } from '@iptv-manager/shared';

export const EditServerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: server, isLoading } = useQuery({
    queryKey: ['servers', id],
    queryFn: () => serversApi.list().then(servers => servers.find((s: any) => s.id === id)),
  });

  const { update } = useCrud<any, ServerInput>({
    queryKey: ['servers'],
    updateFn: serversApi.update,
    listPath: '/servers',
    entityName: 'Servidor',
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <FormLayout title="Editar Servidor">
      <ServerForm 
        initialData={server}
        onSubmit={async (data) => await update(id!, data)} 
        onCancel={() => navigate('/servers')} 
      />
    </FormLayout>
  );
};

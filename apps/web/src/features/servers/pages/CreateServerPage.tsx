import React from 'react';
import { useNavigate } from 'react-router-dom';
import { serversApi } from '../api/servers.api';
import { ServerForm } from './ServerForm';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { ServerInput } from '@iptv-manager/shared';

export const CreateServerPage: React.FC = () => {
  const navigate = useNavigate();
  const { create } = useCrud<any, ServerInput>({
    queryKey: ['servers'],
    createFn: serversApi.create,
    listPath: '/servers',
    entityName: 'Servidor',
  });

  return (
    <FormLayout title="Novo Servidor">
      <ServerForm 
        onSubmit={async (data) => await create(data)} 
        onCancel={() => navigate('/servers')} 
      />
    </FormLayout>
  );
};

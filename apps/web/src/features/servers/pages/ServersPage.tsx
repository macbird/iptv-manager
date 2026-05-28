import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { serversApi } from '../api/servers.api';
import { CardList, EntityCard } from '../../../shared/ui/lists/EntityCard';
import { Plus, ExternalLink, Server } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomSheet } from '../../../shared/ui/modals/BottomSheet';
import { useCrud } from '../../../shared/hooks/useCrud';

export const ServersPage: React.FC = () => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: servers, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: serversApi.list,
  });

  const { remove } = useCrud({
    queryKey: ['servers'],
    deleteFn: serversApi.delete,
    listPath: '/servers',
    entityName: 'Servidor',
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Servidores</h1>
        <Link 
          to="/servers/new"
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-5 w-5" />
          Novo Servidor
        </Link>
      </div>

      <CardList>
        {servers?.map((server: any) => (
          <EntityCard
            key={server.id}
            icon={<Server className="h-5 w-5" />}
            title={server.name}
            subtitle={server.panelUrl}
            status={server.status}
            footer={
              <a 
                href={server.panelUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center text-indigo-600 hover:text-indigo-500 font-medium text-sm"
              >
                Abrir Painel <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            }
            onEdit={() => navigate(`/servers/${server.id}/edit`)}
            onDelete={() => setDeleteId(server.id)}
          />
        ))}
      </CardList>

      {servers?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Nenhum servidor cadastrado.</p>
        </div>
      )}

      <BottomSheet 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        title="Excluir Servidor"
        description="Tem certeza que deseja excluir este servidor? Esta ação não poderá ser desfeita."
      />
    </div>
  );
};

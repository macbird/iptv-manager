import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serversApi } from '../api/servers.api';
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2, Server, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../shared/ui/modals/Modal';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';

export const ServersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['servers', page, filter],
    queryFn: () => serversApi.list({ page, pageSize, filter }),
  });

  const deleteMutation = useMutation({
    mutationFn: serversApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setDeleteId(null);
    },
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const columns = [
    { header: 'Nome', accessor: (s: any) => s.name },
    { 
      header: 'Painel', 
      accessor: (s: any) => (
        <a href={s.panelUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center">
          {s.panelUrl} <ExternalLink className="ml-1 w-3 h-3" />
        </a>
      )
    },
    { 
      header: 'Ações', 
      accessor: (s: any) => (
        <div className="flex justify-end">
          <button onClick={() => navigate(`/servers/${s.id}/edit`)} className="text-slate-500 hover:text-indigo-600 p-2"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(s.id)} className="text-slate-500 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  const renderMobileCard = (s: any) => (
    <>
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-slate-900 uppercase truncate pr-2 flex items-center">
          <Server className="w-4 h-4 mr-2 text-slate-400" /> {s.name}
        </div>
        <div className="flex shrink-0">
          <button onClick={() => navigate(`/servers/${s.id}/edit`)} className="text-slate-500 hover:text-indigo-600 p-1"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(s.id)} className="text-slate-500 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="text-xs text-slate-600 border-t pt-2">
        <a href={s.panelUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center">
          {s.panelUrl} <ExternalLink className="ml-1 w-3 h-3" />
        </a>
      </div>
    </>
  );

  return (
    <PageLayout
      title="Servidores"
      actions={
        <button onClick={() => navigate('/servers/new')} className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm">
          <Plus className="w-4 h-4 mr-1" /> Novo
        </button>
      }
      footer={
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Página {page} de {totalPages || 1}</span>
          <div className="flex space-x-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      }
    >
      <FilterInput onFilterChange={(value) => { setFilter(value); setPage(1); }} currentFilter={filter} />
      
      <ResponsiveDataGrid 
        data={data?.data || []} 
        columns={columns} 
        renderMobileCard={renderMobileCard} 
        isLoading={isLoading}
      />
      
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Excluir Servidor"
        description="Tem certeza que deseja excluir este servidor? Esta ação não poderá ser desfeita."
      />
    </PageLayout>
  );
};

const FilterInput = React.memo(({ onFilterChange, currentFilter }: { onFilterChange: (v: string) => void, currentFilter: string }) => {
  const [term, setTerm] = useState(currentFilter);

  React.useEffect(() => {
    const handler = setTimeout(() => {
        onFilterChange(term);
    }, 500);
    return () => clearTimeout(handler);
  }, [term, onFilterChange]);

  return (
    <div className="relative mt-4">
      <input
        type="text"
        placeholder="Filtrar por nome..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="w-full border border-slate-300 rounded-md p-2 pr-10"
      />
      {term && (
        <button 
          onClick={() => { setTerm(''); onFilterChange(''); }}
          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      )}
    </div>
  );
});

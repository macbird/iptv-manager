import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api/plans.api';
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../shared/ui/modals/Modal';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';

export const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['plans', page, filter],
    queryFn: () => plansApi.list({ page, pageSize, filter }),
  });

  const deleteMutation = useMutation({
    mutationFn: plansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setDeleteId(null);
    },
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const columns = [
    { header: 'Nome', accessor: (p: any) => p.name },
    { header: 'Conexões', accessor: (p: any) => p.maxConnections },
    { header: 'Preço', accessor: (p: any) => `R$ ${p.price}` },
    { 
      header: 'Ações', 
      accessor: (p: any) => (
        <div className="flex justify-end">
          <button onClick={() => navigate(`/plans/${p.id}/edit`)} className="text-slate-500 hover:text-indigo-600 p-2"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(p.id)} className="text-slate-500 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  const renderMobileCard = (p: any) => (
    <>
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-slate-900 uppercase truncate pr-2 flex items-center">
          <CreditCard className="w-4 h-4 mr-2 text-slate-400" /> {p.name}
        </div>
        <div className="flex shrink-0">
          <button onClick={() => navigate(`/plans/${p.id}/edit`)} className="text-slate-500 hover:text-indigo-600 p-1"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(p.id)} className="text-slate-500 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="text-xs text-slate-600 grid grid-cols-2 gap-y-1 border-t pt-2">
        <div className="truncate"><span className="font-semibold text-slate-500">Conexões:</span> {p.maxConnections}</div>
        <div className="truncate"><span className="font-semibold text-slate-500">Preço:</span> R$ {p.price}</div>
      </div>
    </>
  );

  return (
    <PageLayout
      title="Planos"
      actions={
        <button onClick={() => navigate('/plans/new')} className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm">
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
        title="Excluir Plano"
        description="Tem certeza que deseja excluir este plano? Esta ação não poderá ser desfeita."
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

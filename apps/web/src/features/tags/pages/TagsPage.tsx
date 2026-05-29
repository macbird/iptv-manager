import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../api/tags.api';
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../shared/ui/modals/Modal';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';

export const TagsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['tags', page, filter],
    queryFn: () => tagsApi.list({ page, pageSize, filter }),
  });

  const deleteMutation = useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setDeleteId(null);
    },
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const columns = [
    { header: 'Nome', accessor: (t: any) => t.name },
    { 
      header: 'Cor', 
      accessor: (t: any) => (
        <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2 shadow-inner" style={{ backgroundColor: t.color || '#ccc' }}></div>
            {t.color || 'Sem cor'}
        </div>
      )
    },
    { 
      header: 'Ações', 
      accessor: (t: any) => (
        <div className="flex justify-end">
          <button onClick={() => navigate(`/tags/${t.id}/edit`)} className="text-slate-500 hover:text-indigo-600 p-2"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(t.id)} className="text-slate-500 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  const renderMobileCard = (t: any) => (
    <>
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-slate-900 uppercase truncate pr-2 flex items-center">
          <Tag className="w-4 h-4 mr-2 text-slate-400" /> {t.name}
        </div>
        <div className="flex shrink-0">
          <button onClick={() => navigate(`/tags/${t.id}/edit`)} className="text-slate-500 hover:text-indigo-600 p-1"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(t.id)} className="text-slate-500 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="text-xs text-slate-600 border-t pt-2 flex items-center">
          <span className="font-semibold text-slate-500 mr-2">Cor:</span>
          <div className="w-4 h-4 rounded-full mr-2 shadow-inner" style={{ backgroundColor: t.color || '#ccc' }}></div>
          {t.color || 'Sem cor'}
      </div>
    </>
  );

  return (
    <PageLayout
      title="Tags"
      actions={
        <button onClick={() => navigate('/tags/new')} className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm">
          <Plus className="w-4 h-4 mr-1" /> Nova
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
        title="Excluir Tag"
        description="Tem certeza que deseja excluir esta tag? Esta ação não poderá ser desfeita."
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

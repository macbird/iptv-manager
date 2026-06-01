import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api/plans.api';
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../shared/ui/modals/Modal';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';

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
    { header: 'Nome', accessor: (p: any) => p.name, width: '40%' },
    { header: 'Conexões', accessor: (p: any) => p.maxConnections, width: '15%', align: 'center' as const },
    { header: 'Preço', accessor: (p: any) => `R$ ${p.price}`, width: '20%' },
    { 
      header: 'Ações',
      width: '120px',
      align: 'right' as const,
      accessor: (p: any) => (
        <div className="flex justify-end">
          <button onClick={() => navigate(`/plans/${p.id}/edit`)} className="text-slate-500 hover:text-indigo-600 p-2"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(p.id)} className="text-slate-500 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  const renderMobileCard = (p: any) => (
    <div className="flex items-center justify-between group h-12">
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
          <CreditCard className="w-5 h-5 text-slate-400" />
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-bold text-slate-900 truncate leading-tight">{p.name}</div>
          <div className="text-[10px] text-slate-400 truncate leading-tight">{p.maxConnections} conexões</div>
        </div>
      </div>

      <div className="flex items-center shrink-0 gap-2 w-[55%]">
        <div className="flex-1 text-center">
          <div className="text-sm font-medium text-slate-900">R$ {p.price}</div>
        </div>
        
        <div className="w-10 shrink-0 flex items-center justify-end">
          <button onClick={() => navigate(`/plans/${p.id}/edit`)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(p.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Planos"
      noPadding={true}
      actions={
        <PageHeaderActions 
          onSearch={setFilter}
          currentFilter={filter}
          primaryAction={{
            label: 'Novo',
            onClick: () => navigate('/plans/new')
          }}
        />
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
      <ResponsiveDataGrid 
        data={data?.data || []} 
        columns={columns} 
        renderMobileCard={renderMobileCard} 
        mobileHeaderTitles={['Nome', 'Preço']}
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


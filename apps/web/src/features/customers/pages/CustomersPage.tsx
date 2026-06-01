import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import { ChevronLeft, ChevronRight, Edit2, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../shared/ui/modals/Modal';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 10;
  
  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, filter],
    queryFn: () => customersApi.list({ page, pageSize, filter }),
  });

  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteId(null);
    },
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Ativo', classes: 'bg-green-100 text-green-700' };
      case 'overdue': return { label: 'Vencido', classes: 'bg-red-100 text-red-700' };
      case 'trial': return { label: 'Teste', classes: 'bg-amber-100 text-amber-700' };
      case 'blocked': return { label: 'Bloqueado', classes: 'bg-slate-100 text-slate-700' };
      default: return { label: status, classes: 'bg-slate-100 text-slate-700' };
    }
  };

  const columns = [
    { header: 'Nome', accessor: (c: any) => c.name, width: '22%' },
    { header: 'Plano', accessor: (c: any) => c.plan?.name || '-', width: '16%' },
    { header: 'Conexões', accessor: (c: any) => c.connections?.length || 0, width: '10%', align: 'center' as const },
    { header: 'Telefone', accessor: (c: any) => c.phone || '-', width: '16%' },
    { header: 'Vencimento', accessor: (c: any) => c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '-', width: '14%' },
    { 
      header: 'Ações',
      width: '120px',
      align: 'right' as const,
      accessor: (c: any) => (
        <div className="flex justify-end">
          <button onClick={() => navigate(`/customers/${c.id}/edit`)} className="text-slate-500 hover:text-indigo-600 p-2"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteId(c.id)} className="text-slate-500 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  const renderMobileCard = (c: any) => {
    const statusInfo = getStatusInfo(c.status);
    const initials = c.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    return (
      <div className="flex items-center justify-between group py-1">
        <div className="flex items-center space-x-3 overflow-hidden flex-1">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500">{initials}</span>
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-slate-900 truncate leading-tight mb-0.5">{c.name}</div>
            <div className="flex flex-col">
              <div className="text-[10px] text-slate-400 truncate leading-none mb-1">{c.phone || 'Sem telefone'}</div>
              <div className="text-[9px] font-medium text-indigo-500/70 uppercase tracking-tighter leading-none">
                {c.connections?.length || 0} conexões
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0 gap-2 w-[55%]">
          <div className="flex-1 text-center min-w-0 overflow-hidden">
            <div className="text-[11px] font-semibold text-slate-700 truncate">{c.plan?.name || '-'}</div>
          </div>

          <div className="flex-1 text-center min-w-0">
            <div className={`text-[11px] font-bold truncate ${c.status === 'overdue' ? 'text-red-500' : 'text-slate-900'}`}>
              {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
            </div>
          </div>
          
          <div className="w-10 shrink-0 flex justify-end">
            <div className="flex">
              <button onClick={() => navigate(`/customers/${c.id}/edit`)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => setDeleteId(c.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageLayout
      title="Clientes"
      noPadding={true}
      actions={
        <PageHeaderActions 
          onSearch={setFilter}
          currentFilter={filter}
          primaryAction={{
            label: 'Novo',
            onClick: () => navigate('/customers/new')
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
        mobileHeaderTitles={['Nome', 'Plano', 'Venc']}
        isLoading={isLoading}
      />

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não poderá ser desfeita."
      />
    </PageLayout>
  );
};

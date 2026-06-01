import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '../api/admin.api';
import { Users, Plus, Key, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { ResetPasswordModal } from './ResetPasswordModal';
import { showToast } from '../../../shared/utils/toast';

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [resetUser, setResetUser] = React.useState<{ id: string, name: string, email: string } | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: tenantsApi.list,
  });

  const toggleMutation = useMutation({
    mutationFn: (args: { id: string, status: 'active' | 'suspended' }) => tenantsApi.toggleStatus(args.id, args.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showToast.success('Status atualizado');
    }
  });

  const columns = [
    { header: 'Nome', accessor: (a: any) => a.name, width: '35%' },
    { header: 'Status', width: '20%', align: 'center' as const, accessor: (a: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {a.status}
        </span>
    )},
    { 
      header: 'Ações',
      width: '200px',
      align: 'right' as const,
      accessor: (a: any) => (
        <div className="flex justify-end space-x-2">
           <button 
            onClick={() => toggleMutation.mutate({ id: a.id, status: a.status === 'active' ? 'suspended' : 'active' })}
            className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
          >
            {a.status === 'active' ? 'Suspender' : 'Reativar'}
          </button>
          <button 
            onClick={() => {
              console.log('DEBUG: Reset button clicked. Account data:', JSON.stringify(a, null, 2));
              setResetUser({ id: a.users[0]?.id, name: a.users[0]?.name, email: a.users[0]?.email });
            }} 
            className="text-slate-500 hover:text-indigo-600 p-2"
          >
            <Key className="w-4 h-4" />
          </button>
          <button onClick={() => navigate(`/admin/accounts/${a.id}/edit`)} className="text-slate-500 hover:text-indigo-600 p-2"><Edit2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  const renderMobileCard = (a: any) => (
    <div className="flex items-center justify-between group h-14">
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
          <Users className="w-5 h-5 text-slate-400" />
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-bold text-slate-900 truncate leading-tight">{a.name}</div>
          <div className="text-[10px] text-slate-400 truncate leading-tight">{a.users?.length || 0} usuários</div>
        </div>
      </div>

      <div className="flex items-center shrink-0 gap-2 w-[55%]">
        <div className="flex-1 text-center min-w-0">
             <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border border-current opacity-80`}>
                {a.status}
            </span>
        </div>
        
        <div className="w-10 shrink-0 flex justify-end items-center">
            <button 
              onClick={() => setResetUser({ id: a.users[0]?.id, name: a.users[0]?.name, email: a.users[0]?.email })} 
              className="p-2 text-slate-400 hover:text-indigo-600"
            >
              <Key className="w-4 h-4" />
            </button>
            <button onClick={() => navigate(`/admin/accounts/${a.id}/edit`)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Contas"
      noPadding={true}
      actions={
        <button 
          onClick={() => navigate('/admin/accounts/new')}
          className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 text-sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          Nova
        </button>
      }
    >
      <ResponsiveDataGrid 
        data={accounts || []} 
        columns={columns} 
        renderMobileCard={renderMobileCard} 
        mobileHeaderTitles={['Nome', 'Status']}
        isLoading={isLoading}
      />

      <ResetPasswordModal 
        userId={resetUser?.id || null}
        userName={resetUser?.name || null}
        userEmail={resetUser?.email || null}
        onClose={() => setResetUser(null)}
        onSuccess={() => {}}
      />
    </PageLayout>
  );
};

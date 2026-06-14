import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '../api/admin.api';
import { Users, Key, Edit2, Receipt } from 'lucide-react';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { ListPagination } from '../../../shared/ui/lists/ListPagination';
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList';
import { ResetPasswordModal } from './ResetPasswordModal';
import { AccountFormModal } from '../components/AccountFormModal';
import { useEntityFormModal, useOpenFormFromRouteState } from '../../../shared/hooks/useEntityFormModal';
import {
  getApiErrorMessage,
  isPastCalendarDate,
  resolveAccountListRowAccent,
  EVOLUTION_INTEGRITY_LABELS,
  type EvolutionInstanceIntegrityStatus,
} from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';
import type { AccountListItem } from '@client-manager/shared';

function evolutionBadgeClass(status: EvolutionInstanceIntegrityStatus): string {
  switch (status) {
    case 'connected':
      return 'bg-emerald-100 text-emerald-800';
    case 'pending':
      return 'bg-sky-100 text-sky-800';
    case 'missing_db':
    case 'missing_remote':
      return 'bg-red-100 text-red-800';
    case 'disconnected':
      return 'bg-orange-100 text-orange-800';
    case 'unknown':
    case 'not_configured':
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function AccountHealthBadges({ account }: { account: AccountListItem }) {
  const badges: Array<{ key: string; label: string; className: string; title: string }> = [];

  if (account.evolutionIntegrity) {
    const meta = EVOLUTION_INTEGRITY_LABELS[account.evolutionIntegrity.status];
    if (account.evolutionIntegrity.status !== 'connected') {
      badges.push({
        key: 'evolution',
        label: meta.label,
        className: evolutionBadgeClass(account.evolutionIntegrity.status),
        title: meta.title,
      });
    }
  }

  if (account.status === 'active' && !account.paymentConfigured) {
    badges.push({
      key: 'mp',
      label: 'Sem MP',
      className: 'bg-amber-100 text-amber-800',
      title: 'Mercado Pago não configurado pelo tenant',
    });
  }
  if (account.status === 'active' && !account.phone?.trim()) {
    badges.push({
      key: 'phone',
      label: 'Sem tel',
      className: 'bg-orange-100 text-orange-800',
      title: 'Telefone da conta não cadastrado — cobrança WhatsApp da plataforma pode falhar',
    });
  }
  if (!account.subscription) {
    badges.push({
      key: 'sub',
      label: 'Sem plano',
      className: 'bg-slate-100 text-slate-700',
      title: 'Sem assinatura/plano vinculado',
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${badge.className}`}
          title={badge.title}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

export const AccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const formModal = useEntityFormModal();
  useOpenFormFromRouteState(formModal);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [resetUser, setResetUser] = React.useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    filter,
    setFilter,
    goToPreviousPage,
    goToNextPage,
    isLoading,
  } = usePaginatedList<AccountListItem>({
    queryKey: ['accounts', statusFilter],
    queryFn: (params) => tenantsApi.list({ ...params, status: statusFilter || undefined }),
  });

  const toggleMutation = useMutation({
    mutationFn: (args: { id: string; status: 'active' | 'inactive' }) =>
      tenantsApi.toggleStatus(args.id, args.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showToast.success('Status atualizado');
    },
    onError: (err: unknown) => {
      showToast.error(getApiErrorMessage(err, 'Erro ao atualizar status'));
    },
  });

  const openResetPassword = (account: AccountListItem) => {
    const owner = account.users[0];
    if (!owner?.email) {
      showToast.error('Conta sem usuário proprietário para resetar senha');
      return;
    }
    setResetUser({ id: owner.id, name: owner.name, email: owner.email });
  };

  const generateInvoiceMutation = useMutation({
    mutationFn: tenantsApi.generateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast.success('Fatura gerada');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast.error(getApiErrorMessage(err, 'Erro ao gerar fatura'));
    },
  });

  const formatDueDate = (value?: string | null, emphasizeOverdue = false) => {
    if (!value) return '—';
    const formatted = new Date(value).toLocaleDateString('pt-BR');
    if (emphasizeOverdue && isPastCalendarDate(value)) {
      return <span className="font-semibold text-red-600">{formatted}</span>;
    }
    return formatted;
  };

  const columns = [
    { header: 'Nome', accessor: (a: AccountListItem) => (
        <div>
          <div className="flex items-center gap-2">
            <span>{a.name}</span>
          </div>
          <AccountHealthBadges account={a} />
        </div>
      ), width: '24%' },
    {
      header: 'Telefone',
      width: '14%',
      accessor: (a: AccountListItem) => (
        <span className="text-sm text-slate-600">{a.phone ?? '—'}</span>
      ),
    },
    {
      header: 'Plano',
      width: '16%',
      accessor: (a: AccountListItem) =>
        a.subscription?.platformPlan ? (
          <span className="text-sm text-slate-700">{a.subscription.platformPlan.name}</span>
        ) : (
          '—'
        ),
    },
    {
      header: 'Vencimento',
      width: '18%',
      align: 'center' as const,
      accessor: (a: AccountListItem) => (
        <span className="text-sm text-slate-700">
          {formatDueDate(a.subscription?.nextDueDate, a.status === 'active')}
        </span>
      ),
    },
    {
      header: 'Status',
      width: '20%',
      align: 'center' as const,
      accessor: (a: AccountListItem) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {a.status === 'active' ? 'Ativa' : 'Desativada'}
        </span>
      ),
    },
    {
      header: 'Ações',
      width: '200px',
      align: 'right' as const,
      accessor: (a: AccountListItem) => (
        <div className="flex justify-end space-x-1">
          <button
            type="button"
            onClick={() => generateInvoiceMutation.mutate(a.id)}
            disabled={!a.subscription || generateInvoiceMutation.isPending}
            className="p-2 text-slate-500 hover:text-emerald-600 disabled:opacity-40"
            aria-label="Gerar fatura"
            title="Gerar fatura"
          >
            <Receipt className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              toggleMutation.mutate({
                id: a.id,
                status: a.status === 'active' ? 'inactive' : 'active',
              })
            }
            className="text-xs font-semibold text-slate-600 hover:text-form-primary"
          >
            {a.status === 'active' ? 'Desativar' : 'Reativar'}
          </button>
          <button
            type="button"
            onClick={() => openResetPassword(a)}
            className="p-2 text-slate-500 hover:text-form-primary"
            aria-label="Resetar senha"
          >
            <Key className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formModal.openEdit(a.id)}
            className="p-2 text-slate-500 hover:text-form-primary"
            aria-label="Editar conta"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const renderMobileCard = (a: AccountListItem) => (
    <div className="group flex h-14 items-center justify-between">
      <div className="flex flex-1 items-center space-x-3 overflow-hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
          <Users className="h-5 w-5 text-slate-400" />
        </div>
        <div className="overflow-hidden">
          <div className="truncate text-sm font-bold leading-tight text-slate-900">{a.name}</div>
          <div className="truncate text-[10px] leading-tight text-slate-400">
            {a.phone ?? 'Sem telefone'} · {a.users?.length || 0} usuários
          </div>
          <AccountHealthBadges account={a} />
        </div>
      </div>

      <div className="flex w-[55%] shrink-0 items-center gap-2">
        <div className="min-w-0 flex-1 text-center">
          <div className="text-xs font-medium text-slate-700">
            {formatDueDate(a.subscription?.nextDueDate, a.status === 'active')}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center">
          <span
            className={`rounded-full border border-current px-2 py-0.5 text-[9px] font-black uppercase tracking-wider opacity-80 ${
              a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {a.status === 'active' ? 'Ativa' : 'Desativada'}
          </span>
        </div>

        <div className="flex w-16 shrink-0 items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => generateInvoiceMutation.mutate(a.id)}
            disabled={!a.subscription || generateInvoiceMutation.isPending}
            className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-40"
            aria-label="Gerar fatura"
          >
            <Receipt className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openResetPassword(a)}
            className="p-2 text-slate-400 hover:text-form-primary"
            aria-label="Resetar senha"
          >
            <Key className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => formModal.openEdit(a.id)}
            className="p-2 text-slate-400 hover:text-form-primary"
            aria-label="Editar conta"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Contas"
      noPadding={true}
      actions={
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
            aria-label="Filtrar por status"
          >
            <option value="">Todas</option>
            <option value="active">Ativas</option>
            <option value="inactive">Desativadas</option>
          </select>
          <PageHeaderActions
            onSearch={setFilter}
            currentFilter={filter}
            primaryAction={{
              label: 'Nova',
              onClick: formModal.openCreate,
            }}
          />
        </div>
      }
      footer={
        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      }
    >
      <ResponsiveDataGrid
        data={items}
        columns={columns}
        renderMobileCard={renderMobileCard}
        mobileHeaderTitles={['Nome', 'Venc.', 'Status']}
        isLoading={isLoading}
        getRowAccent={(a) =>
          resolveAccountListRowAccent({
            status: a.status,
            nextDueDate: a.subscription?.nextDueDate,
          })
        }
      />

      <AccountFormModal isOpen={formModal.isOpen} editId={formModal.editId} onClose={formModal.close} />

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

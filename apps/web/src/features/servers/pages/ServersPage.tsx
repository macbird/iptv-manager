import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serversApi } from '../api/servers.api';
import { Edit2, Server, ExternalLink } from 'lucide-react';
import { Modal } from '../../../shared/ui/modals/Modal';
import { ServerFormModal } from '../components/ServerFormModal';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';
import { ListPagination } from '../../../shared/ui/lists/ListPagination';
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList';
import { useListFilterModal } from '../../../shared/hooks/useListFilterModal';
import { ListFiltersModal } from '../../../shared/ui/lists/ListFiltersModal';
import { SERVER_FILTER_FIELDS } from '../../../shared/ui/lists/list-filter-fields';
import { useEntityFormModal, useOpenFormFromRouteState } from '../../../shared/hooks/useEntityFormModal';
import { EntityLifecycleActions } from '../../../shared/ui/buttons/EntityLifecycleActions';
import {
  getApiErrorMessage,
  getServerListStatusBadgeClass,
  getServerListStatusLabel,
  resolveServerListRowAccent,
} from '@client-manager/shared';
import { ListEntityStatusBadge } from '../../../shared/ui/lists/ListEntityStatusBadge';
import { showToast } from '../../../shared/utils/toast';

type ServerRow = {
  id: string;
  name: string;
  panelUrl: string;
  maxConnections?: number | null;
  status: string;
};

export const ServersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [lifecycleTarget, setLifecycleTarget] = useState<{
    id: string;
    name: string;
    action: 'deactivate' | 'activate';
  } | null>(null);
  const formModal = useEntityFormModal();
  useOpenFormFromRouteState(formModal);

  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    filter,
    setFilter,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
    goToPreviousPage,
    goToNextPage,
    isLoading,
  } = usePaginatedList<ServerRow>({
    queryKey: ['servers'],
    queryFn: serversApi.list,
  });

  const filterModal = useListFilterModal(filters, setFilters, clearFilters);

  const lifecycleMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'deactivate' | 'activate' }) =>
      action === 'deactivate' ? serversApi.deactivate(id) : serversApi.activate(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setLifecycleTarget(null);
      showToast.success(
        variables.action === 'deactivate' ? 'Servidor desativado' : 'Servidor reativado',
      );
    },
    onError: (err: unknown) =>
      showToast.error(getApiErrorMessage(err, 'Não foi possível alterar o status do servidor')),
  });

  const renderActions = (row: ServerRow) => (
    <div className="flex justify-end">
      <button
        onClick={() => formModal.openEdit(row.id)}
        className="text-slate-500 hover:text-indigo-600 p-2"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <EntityLifecycleActions
        status={row.status}
        isPending={lifecycleMutation.isPending}
        entityLabel="servidor"
        onDeactivate={() =>
          setLifecycleTarget({ id: row.id, name: row.name, action: 'deactivate' })
        }
        onActivate={() =>
          setLifecycleTarget({ id: row.id, name: row.name, action: 'activate' })
        }
      />
    </div>
  );

  const columns = [
    { header: 'Nome', accessor: (s: ServerRow) => s.name, width: '22%' },
    {
      header: 'Status',
      accessor: (s: ServerRow) => (
        <ListEntityStatusBadge
          label={getServerListStatusLabel(s.status)}
          badgeClassName={getServerListStatusBadgeClass(s.status)}
        />
      ),
      width: '14%',
      align: 'center' as const,
    },
    {
      header: 'Painel',
      width: '48%',
      accessor: (s: ServerRow) => (
        <a
          href={s.panelUrl}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          {s.panelUrl} <ExternalLink className="ml-1 w-3 h-3" />
        </a>
      ),
    },
    {
      header: 'Ações',
      width: '120px',
      align: 'right' as const,
      accessor: (s: ServerRow) => renderActions(s),
    },
  ];

  const renderMobileCard = (s: ServerRow) => (
    <div className="flex items-center justify-between group py-1">
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
          <Server className="h-5 w-5 text-slate-400" />
        </div>
        <div className="overflow-hidden">
          <div className="mb-0.5 truncate text-sm font-bold leading-tight text-slate-900">
            {s.name}
          </div>
          <div className="truncate text-[10px] leading-none text-slate-400">{s.panelUrl}</div>
        </div>
      </div>

      <div className="flex w-[55%] shrink-0 items-center gap-2">
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-[10px] text-slate-400">Conexões</div>
          <div className="truncate text-[11px] font-bold text-slate-900">
            {s.maxConnections ?? 0}
          </div>
        </div>
        <div className="flex min-w-[4.5rem] shrink-0 flex-col items-end gap-1">
          <ListEntityStatusBadge
            label={getServerListStatusLabel(s.status)}
            badgeClassName={getServerListStatusBadgeClass(s.status)}
          />
          <div className="flex items-center justify-end">{renderActions(s)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Servidores"
      noPadding={true}
      actions={
        <PageHeaderActions
          onSearch={setFilter}
          currentFilter={filter}
          onOpenFilters={filterModal.open}
          activeFilterCount={activeFilterCount}
          primaryAction={{
            label: 'Novo',
            onClick: formModal.openCreate,
          }}
        />
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
        mobileHeaderTitles={['Nome', 'Conexões']}
        isLoading={isLoading}
        getRowAccent={(s) => resolveServerListRowAccent(s.status)}
      />

      <ServerFormModal isOpen={formModal.isOpen} editId={formModal.editId} onClose={formModal.close} />

      <Modal
        isOpen={!!lifecycleTarget}
        onClose={() => setLifecycleTarget(null)}
        onConfirm={() =>
          lifecycleTarget &&
          lifecycleMutation.mutate({ id: lifecycleTarget.id, action: lifecycleTarget.action })
        }
        confirmTone="primary"
        confirmLabel={lifecycleTarget?.action === 'deactivate' ? 'Desativar' : 'Reativar'}
        title={
          lifecycleTarget?.action === 'deactivate' ? 'Desativar servidor' : 'Reativar servidor'
        }
        description={
          lifecycleTarget?.action === 'deactivate'
            ? `Desativar "${lifecycleTarget?.name}"? O servidor não aparecerá em novas conexões.`
            : `Reativar "${lifecycleTarget?.name}"?`
        }
      />

      <ListFiltersModal
        isOpen={filterModal.isOpen}
        onClose={() => filterModal.setIsOpen(false)}
        fields={SERVER_FILTER_FIELDS}
        draft={filterModal.draft}
        onDraftChange={filterModal.setDraft}
        onApply={filterModal.apply}
        onClear={filterModal.clear}
      />
    </PageLayout>
  );
};

import React from 'react';
import type { AuditLogListItem } from '@client-manager/shared';
import { logsApi } from '../api/logs.api';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';
import { ListPagination } from '../../../shared/ui/lists/ListPagination';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList';

function formatMetadataBrief(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;

  const parts: string[] = [];
  if (typeof metadata.customerName === 'string') {
    parts.push(metadata.customerName);
  }
  if (typeof metadata.source === 'string') {
    parts.push(`fonte: ${metadata.source}`);
  }
  if (typeof metadata.messagesCount === 'number') {
    parts.push(`${metadata.messagesCount} mensagem(ns)`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export const LogsPage: React.FC = () => {
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
  } = usePaginatedList<AuditLogListItem>({
    queryKey: ['audit-logs'],
    queryFn: (params) => logsApi.list(params),
    pageSize: 20,
  });

  const columns = [
    {
      header: 'Data',
      accessor: (row: AuditLogListItem) =>
        new Date(row.createdAt).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      width: '16%',
    },
    {
      header: 'Ação',
      accessor: (row: AuditLogListItem) => (
        <span className="text-sm font-medium text-slate-900">{row.actionLabel}</span>
      ),
      width: '28%',
    },
    {
      header: 'Entidade',
      accessor: (row: AuditLogListItem) => (
        <span className="text-sm text-slate-600">
          {row.entityType}
          {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}
        </span>
      ),
      width: '22%',
    },
    {
      header: 'Usuário',
      accessor: (row: AuditLogListItem) => row.actorName ?? 'Sistema',
      width: '16%',
    },
    {
      header: 'Detalhes',
      accessor: (row: AuditLogListItem) => formatMetadataBrief(row.metadata) ?? '-',
      width: '18%',
    },
  ];

  const renderMobileCard = (row: AuditLogListItem) => {
    const details = formatMetadataBrief(row.metadata);

    return (
      <div className="py-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-slate-900">{row.actionLabel}</div>
            <div className="mt-0.5 truncate text-[10px] text-slate-400">
              {row.actorName ?? 'Sistema'} · {row.entityType}
            </div>
            {details ? (
              <div className="mt-1 truncate text-[10px] text-slate-500">{details}</div>
            ) : null}
          </div>
          <div className="shrink-0 text-right text-[10px] text-slate-400">
            {new Date(row.createdAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageLayout
      title="Registro de atividades"
      noPadding
      actions={
        <PageHeaderActions
          onSearch={setFilter}
          currentFilter={filter}
          placeholder="Buscar ação ou entidade..."
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
        mobileHeaderTitles={['Ação', 'Data']}
        isLoading={isLoading}
      />
    </PageLayout>
  );
};

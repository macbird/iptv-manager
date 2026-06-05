import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import type { PaymentWebhookLogDto } from '@client-manager/shared';
import { tenantBillingApi } from '../../billing/api/billing.api';

const OUTCOME_LABELS: Record<string, string> = {
  success: 'Sucesso',
  ignored: 'Ignorado',
  idempotent: 'Duplicado',
  error: 'Erro',
};

function outcomeClass(outcome: string): string {
  if (outcome === 'success') return 'bg-emerald-100 text-emerald-800';
  if (outcome === 'error') return 'bg-red-100 text-red-800';
  if (outcome === 'ignored') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR');
}

function parseSteps(detail: string | null): string[] {
  if (!detail) return [];
  try {
    const parsed = JSON.parse(detail) as { steps?: string[] };
    return Array.isArray(parsed.steps) ? parsed.steps : [];
  } catch {
    return [];
  }
}

export const WebhookLogsSection: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: tenantBillingApi.getWebhookLogs,
    refetchInterval: 30_000,
  });

  const logs = (data ?? []) as PaymentWebhookLogDto[];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Logs de webhook (PIX)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Histórico das notificações do Mercado Pago para diagnosticar falhas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Carregando logs...</p>
      ) : logs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Nenhuma notificação registrada ainda. Gere um PIX e pague para testar.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {logs.map((log) => {
            const steps = parseSteps(log.detail);
            return (
              <li key={log.id} className="rounded-md border border-slate-200 p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 font-medium ${outcomeClass(log.outcome)}`}>
                    {OUTCOME_LABELS[log.outcome] ?? log.outcome}
                  </span>
                  <span className="text-slate-500">{formatDate(log.createdAt)}</span>
                  <span className="text-slate-500">
                    {log.httpMethod} · HTTP {log.statusCode}
                  </span>
                  {log.paymentId ? (
                    <span className="font-mono text-slate-700">payment: {log.paymentId}</span>
                  ) : null}
                </div>

                {log.errorMessage ? (
                  <p className="mt-2 text-red-700">{log.errorMessage}</p>
                ) : null}

                {steps.length > 0 ? (
                  <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-slate-600">
                    {steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

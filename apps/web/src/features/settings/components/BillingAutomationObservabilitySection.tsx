import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BillingAutomationPreviewAction,
  BillingAutomationSettingsDto,
} from '@client-manager/shared';
import { tenantBillingApi } from '../../billing/api/billing.api';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';

interface BillingAutomationObservabilitySectionProps {
  settings: BillingAutomationSettingsDto;
}

const ACTION_LABELS: Record<BillingAutomationPreviewAction, string> = {
  send_charge: 'Enviar cobrança',
  create_invoice_and_send: 'Criar fatura + enviar',
  create_invoice_only: 'Só criar fatura',
  skip_already_sent: 'Já enviado',
  skip_whatsapp_disabled: 'WhatsApp desligado',
  skip_inactive: 'Sem plano válido',
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
  }).format(new Date(value));
}

function formatMoney(cents: number | null): string {
  if (cents === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

/**
 * Shows last automation run and dry-run preview for the D-N billing window.
 */
export const BillingAutomationObservabilitySection: React.FC<
  BillingAutomationObservabilitySectionProps
> = ({ settings }) => {
  const queryClient = useQueryClient();

  const { data: schedulerMeta } = useQuery({
    queryKey: ['billing-automation-scheduler-meta'],
    queryFn: tenantBillingApi.getBillingAutomationSchedulerMeta,
  });

  const { data: globalLastRun } = useQuery({
    queryKey: ['billing-automation-global-last-run'],
    queryFn: tenantBillingApi.getBillingAutomationGlobalLastRun,
  });

  const { data: lastRun, isLoading: lastRunLoading } = useQuery({
    queryKey: ['billing-automation-last-run'],
    queryFn: tenantBillingApi.getBillingAutomationLastRun,
  });

  const { data: nextRunPreview, isLoading: nextPreviewLoading, refetch: refetchNextPreview } = useQuery({
    queryKey: [
      'billing-automation-preview',
      'next_scheduled_run',
      settings.automationRunHour,
      settings.automationRunMinute,
      settings.daysBeforeDue,
    ],
    queryFn: () =>
      tenantBillingApi.getBillingAutomationPreview({ scenario: 'next_scheduled_run' }),
  });

  const { data: currentPreview, isLoading: currentPreviewLoading } = useQuery({
    queryKey: ['billing-automation-preview', 'current', settings.daysBeforeDue],
    queryFn: () => tenantBillingApi.getBillingAutomationPreview({ scenario: 'current' }),
  });

  const runHourLabel = `${String(settings.automationRunHour).padStart(2, '0')}:${String(settings.automationRunMinute).padStart(2, '0')}`;

  const handleSimulateNextRun = () => {
    void refetchNextPreview();
    void queryClient.invalidateQueries({ queryKey: ['billing-automation-preview', 'current'] });
  };

  return (
    <div className="space-y-4">
      {schedulerMeta?.isDevelopment && !schedulerMeta.matchByClock ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
          Ambiente de desenvolvimento: o job roda a cada {schedulerMeta.intervalMinutes} minutos
          para <strong>todos</strong> os tenants ativos, ignorando o horário configurado acima.
        </div>
      ) : null}

      <div>
        <h4 className="text-sm font-semibold text-slate-900">Observabilidade</h4>
        <p className="mt-1 text-xs text-slate-600">
          Acompanhe a última execução e quem entra na janela D-{settings.daysBeforeDue} antes do
          próximo job.
        </p>
        <button
          type="button"
          onClick={handleSimulateNextRun}
          className="mt-2 rounded-md border border-form-primary/30 bg-white px-3 py-1.5 text-xs font-medium text-form-primary hover:bg-form-primary/5"
        >
          Simular próximo run (dry-run)
        </button>
      </div>

      {globalLastRun?.runAt ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs">
          <h5 className="text-sm font-medium text-slate-900">Último job global do servidor</h5>
          <p className="mt-2 text-slate-600">
            {formatDateTime(globalLastRun.runAt)} · {globalLastRun.tenantsProcessed} tenant(s) ·{' '}
            {globalLastRun.invoicesCreated} fatura(s) · {globalLastRun.chargesSent} cobrança(s) ·{' '}
            {globalLastRun.errorsCount} erro(s)
          </p>
          {globalLastRun.errors.length > 0 ? (
            <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto text-red-700">
              {globalLastRun.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h5 className="text-sm font-medium text-slate-900">Última execução</h5>
        {lastRunLoading ? (
          <div className="relative mt-3 h-10">
            <LoadingSpinner />
          </div>
        ) : (
          <dl className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Quando</dt>
              <dd className="font-medium">{formatDateTime(lastRun?.runAt)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Clientes na janela</dt>
              <dd className="font-medium">{lastRun?.customersScanned ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Faturas criadas</dt>
              <dd className="font-medium">{lastRun?.invoicesCreated ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Cobranças enviadas</dt>
              <dd className="font-medium">{lastRun?.chargesSent ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Ignoradas (D-N)</dt>
              <dd className="font-medium">{lastRun?.chargesSkipped ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Faturas auto-fechadas</dt>
              <dd className="font-medium">{lastRun?.invoicesAutoClosed ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Lembretes D+N enviados</dt>
              <dd className="font-medium">{lastRun?.overdueRemindersSent ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Lembretes D+N falharam</dt>
              <dd className="font-medium">{lastRun?.overdueRemindersFailed ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Relatório WhatsApp tenant</dt>
              <dd className="font-medium">{lastRun?.tenantReportSent ? 'Enviado' : 'Não'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Erros</dt>
              <dd className="font-medium">{lastRun?.errorsCount ?? 0}</dd>
            </div>
          </dl>
        )}
        {lastRun?.errors && lastRun.errors.length > 0 ? (
          <ul className="mt-3 max-h-28 space-y-1 overflow-y-auto text-xs text-red-700">
            {lastRun.errors.map((error) => (
              <li key={error} className="rounded bg-red-50 px-2 py-1">
                {error}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <PreviewCard
        title={`Próxima execução (${formatDateTime(nextRunPreview?.nextScheduledRunAt)} · ${runHourLabel} SP)`}
        loading={nextPreviewLoading}
        preview={nextRunPreview}
        emptyMessage={
          settings.active
            ? 'Nenhum cliente na janela D-N para a próxima execução.'
            : 'Automação desligada — ative para ver o preview.'
        }
      />

      <PreviewCard
        title="Janela D-N agora"
        loading={currentPreviewLoading}
        preview={currentPreview}
        emptyMessage="Nenhum cliente na janela D-N neste momento."
      />
    </div>
  );
};

function PreviewCard(props: {
  title: string;
  loading: boolean;
  preview:
    | {
        totals: {
          inWindow: number;
          willSendCharge: number;
          willCreateInvoice: number;
          willSkipAlreadySent: number;
          willSkipWhatsappDisabled: number;
        };
        customers: Array<{
          customerId: string;
          customerName: string;
          expiresAt: string;
          billingCycleKey: string;
          amountCents: number | null;
          action: BillingAutomationPreviewAction;
        }>;
      }
    | undefined;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-lg border border-form-primary/20 bg-form-primary/5/40 p-4">
      <h5 className="text-sm font-medium text-form-secondary">{props.title}</h5>

      {props.loading ? (
        <div className="relative mt-3 h-10">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {props.preview ? (
            <p className="mt-2 text-xs text-slate-900">
              {props.preview.totals.inWindow} na janela · {props.preview.totals.willSendCharge} vão
              receber cobrança · {props.preview.totals.willCreateInvoice} fatura(s) nova(s) ·{' '}
              {props.preview.totals.willSkipAlreadySent} já enviado(s)
            </p>
          ) : null}

          {props.preview && props.preview.customers.length > 0 ? (
            <div className="mt-3 overflow-x-auto rounded-md border border-form-primary/20 bg-white">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Cliente</th>
                    <th className="px-3 py-2 font-medium">Vencimento</th>
                    <th className="px-3 py-2 font-medium">Ciclo</th>
                    <th className="px-3 py-2 font-medium">Valor</th>
                    <th className="px-3 py-2 font-medium">Ação prevista</th>
                  </tr>
                </thead>
                <tbody>
                  {props.preview.customers.map((customer) => (
                    <tr key={customer.customerId} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-900">{customer.customerName}</td>
                      <td className="px-3 py-2 text-slate-700">{formatDate(customer.expiresAt)}</td>
                      <td className="px-3 py-2 text-slate-700">{customer.billingCycleKey}</td>
                      <td className="px-3 py-2 text-slate-700">{formatMoney(customer.amountCents)}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {ACTION_LABELS[customer.action]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-600">{props.emptyMessage}</p>
          )}
        </>
      )}
    </div>
  );
}

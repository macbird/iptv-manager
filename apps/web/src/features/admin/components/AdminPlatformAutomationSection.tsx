import React from 'react';
import type { PlatformBillingAutomationSettingsDto } from '@client-manager/shared';

interface AdminPlatformAutomationSectionProps {
  value: PlatformBillingAutomationSettingsDto;
  onChange: (value: PlatformBillingAutomationSettingsDto) => void;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export const AdminPlatformAutomationSection: React.FC<AdminPlatformAutomationSectionProps> = ({
  value,
  onChange,
}) => {
  const lastRun = value.lastRun;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Automação mensal</h3>
        <p className="mt-1 text-xs text-slate-600">
          Para cada revenda com vencimento na data, o job executa automaticamente:
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-slate-600">
          <li>Gerar fatura <code className="text-[11px]">scope=platform</code></li>
          <li>Gerar PIX (Mercado Pago da plataforma)</li>
          <li>Enviar cobrança via WhatsApp para o telefone da conta</li>
        </ol>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={value.active}
          onChange={(e) => onChange({ ...value, active: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-form-primary"
        />
        Automação ativa
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Horário diário</label>
          <div className="mt-1 flex gap-2">
            <select
              value={value.automationRunHour}
              onChange={(e) =>
                onChange({ ...value, automationRunHour: Number(e.target.value) })
              }
              className="block w-full rounded-md border border-slate-300 p-2 text-sm"
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}h
                </option>
              ))}
            </select>
            <select
              value={value.automationRunMinute}
              onChange={(e) =>
                onChange({ ...value, automationRunMinute: Number(e.target.value) })
              }
              className="block w-24 rounded-md border border-slate-300 p-2 text-sm"
            >
              {[0, 15, 30, 45].map((minute) => (
                <option key={minute} value={minute}>
                  :{String(minute).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-slate-500">Fuso America/Sao_Paulo.</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.suspendOverdueAccounts}
            onChange={(e) => onChange({ ...value, suspendOverdueAccounts: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-form-primary"
          />
          Suspender contas após dias de inadimplência (usa dias da aba Geral)
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <h4 className="font-semibold text-slate-900">Última execução</h4>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Quando</dt>
            <dd className="font-medium">{formatDateTime(lastRun.runAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Faturas criadas</dt>
            <dd className="font-medium">{lastRun.invoicesCreated}</dd>
          </div>
          <div>
            <dt className="text-slate-500">WhatsApp enviados</dt>
            <dd className="font-medium">{lastRun.chargesSent}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Falhas WhatsApp</dt>
            <dd className="font-medium">{lastRun.chargesFailed}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Contas suspensas</dt>
            <dd className="font-medium">{lastRun.accountsSuspended}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Erros</dt>
            <dd className="font-medium">{lastRun.errorsCount}</dd>
          </div>
        </dl>
        {lastRun.errors.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-red-700">
            {lastRun.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

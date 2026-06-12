import React from 'react';
import type { BillingAutomationSettingsDto } from '@client-manager/shared';
import { DEFAULT_OVERDUE_REMINDERS_SETTINGS } from '@client-manager/shared';
import { BillingAutomationObservabilitySection } from './BillingAutomationObservabilitySection';

interface BillingAutomationSectionProps {
  value: BillingAutomationSettingsDto;
  onChange: (value: BillingAutomationSettingsDto) => void;
}

export const BillingAutomationSection: React.FC<BillingAutomationSectionProps> = ({
  value,
  onChange,
}) => {
  const overdue = value.overdueReminders ?? DEFAULT_OVERDUE_REMINDERS_SETTINGS;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Automação de cobrança</h3>
        <p className="mt-1 text-xs text-slate-600">
          Gera faturas de assinatura e envia WhatsApp para clientes com vencimento IPTV na janela D-N.
          O job do servidor roda uma vez por hora (início de cada hora cheia) e processa tenants cujo
          horário configurado coincide com a hora atual em America/Sao_Paulo.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={value.active}
          onChange={(e) => onChange({ ...value, active: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
        />
        Automação ativa
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Dias antes do vencimento (D-N)</label>
          <input
            type="number"
            min={0}
            max={30}
            value={value.daysBeforeDue}
            onChange={(e) => onChange({ ...value, daysBeforeDue: Number(e.target.value || 0) })}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Horário diário (hora cheia)</label>
          <select
            value={value.automationRunHour}
            onChange={(e) =>
              onChange({
                ...value,
                automationRunHour: Number(e.target.value),
                automationRunMinute: 0,
              })
            }
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, '0')}:00
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Padrão: 09:00. Fuso America/Sao_Paulo. O cron verifica a cada hora (ex.: 09:00, 10:00) —
            escolha apenas horas cheias.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.sendPaymentCharge}
            onChange={(e) => onChange({ ...value, sendPaymentCharge: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          Gerar PIX antes do envio
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.sendWhatsapp}
            onChange={(e) => onChange({ ...value, sendWhatsapp: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          Enviar cobrança via WhatsApp
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Pós-vencimento (D+N)</h4>
          <p className="mt-1 text-xs text-slate-600">
            Reenvia lembrete WhatsApp usando o PIX já gerado — sem criar fatura nem regenerar PIX.
            Cada janela envia no máximo uma mensagem bem-sucedida por fatura.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={overdue.enabled}
            onChange={(e) =>
              onChange({
                ...value,
                overdueReminders: { ...overdue, enabled: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          Lembretes pós-vencimento ativos
        </label>

        {overdue.enabled ? (
          <>
            {!value.active ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                A automação principal está desligada — os lembretes pós-vencimento só rodam quando{' '}
                <strong>Automação ativa</strong> estiver marcada acima.
              </div>
            ) : null}

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-3 text-xs text-indigo-900">
              Configure <strong>quantas janelas quiser</strong> (D+1, D+7, D+20…) e as mensagens de
              cada uma em <strong>Cobrança → Pós-vencimento (D+N)</strong>.
              {overdue.daysAfterDue.length > 0 ? (
                <span className="mt-1 block font-medium">
                  Janelas atuais: {overdue.daysAfterDue.map((day) => `D+${day}`).join(' · ')}
                </span>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Dias de grace após falha
              </label>
              <input
                type="number"
                min={0}
                max={7}
                value={overdue.failureGraceDays}
                onChange={(e) =>
                  onChange({
                    ...value,
                    overdueReminders: {
                      ...overdue,
                      failureGraceDays: Number(e.target.value || 0),
                    },
                  })
                }
                className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 p-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Após o dia ideal da janela, ainda tenta reenviar por mais N dias se nunca houve sucesso.
              </p>
            </div>
          </>
        ) : null}

        <p className="text-xs text-slate-500">
          Após os lembretes configurados, bloqueie o cliente para interromper qualquer cobrança automática.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={value.autoCloseSubscriptionInvoices}
          onChange={(e) =>
            onChange({ ...value, autoCloseSubscriptionInvoices: e.target.checked })
          }
          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
        />
        Cancelar faturas de assinatura não pagas após o prazo (somente assinatura)
      </label>

      {value.autoCloseSubscriptionInvoices ? (
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Dias após o vencimento para cancelar assinatura
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={value.closeSubscriptionInvoiceAfterDays}
            onChange={(e) =>
              onChange({
                ...value,
                closeSubscriptionInvoiceAfterDays: Number(e.target.value || 30),
              })
            }
            className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 p-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Faturas avulsas nunca são canceladas automaticamente. Padrão: desligado.
          </p>
        </div>
      ) : null}

      <BillingAutomationObservabilitySection settings={value} />
    </div>
  );
};

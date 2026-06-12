import React from 'react';
import {
  buildDefaultOverdueChargeMessages,
  buildOverdueChargeMessagePreviewContext,
  type OverdueChargeMessagesDto,
} from '@client-manager/shared';
import { ChargeMessageTemplatesSection } from './ChargeMessageTemplatesSection';

interface OverdueChargeMessageTemplatesSectionProps {
  value: OverdueChargeMessagesDto;
  onChange: (value: OverdueChargeMessagesDto) => void;
  /** Configured overdue windows from automation settings (e.g. [1, 7, 15]). */
  windowDays: number[];
  /** Shared delay between messages (inherits subscription delay). */
  delayMs: number;
}

function ensureWindowTemplates(
  value: OverdueChargeMessagesDto,
  windowDays: number[],
): OverdueChargeMessagesDto {
  const defaults = buildDefaultOverdueChargeMessages();
  const byWindow = { ...value.byWindow };

  for (const day of windowDays) {
    if (!byWindow[day]) {
      byWindow[day] = {
        templates: [
          ...(defaults.byWindow[day]?.templates ?? defaults.generic.templates),
        ],
      };
    }
  }

  return { ...value, byWindow };
}

export const OverdueChargeMessageTemplatesSection: React.FC<
  OverdueChargeMessageTemplatesSectionProps
> = ({ value, onChange, windowDays, delayMs }) => {
  const normalizedValue = React.useMemo(
    () => ensureWindowTemplates(value, windowDays),
    [value, windowDays],
  );

  const sortedWindows = React.useMemo(
    () => [...new Set(windowDays.filter((day) => day >= 1))].sort((a, b) => a - b),
    [windowDays],
  );

  const updateGeneric = (templates: string[]) => {
    onChange({
      ...normalizedValue,
      generic: { templates },
    });
  };

  const updateWindow = (day: number, templates: string[]) => {
    onChange({
      ...normalizedValue,
      byWindow: {
        ...normalizedValue.byWindow,
        [day]: { templates },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Mensagens — pós-vencimento (D+N)</h3>
        <p className="mt-1 text-xs text-slate-600">
          Lembretes enviados após o vencimento usando o PIX já gerado. Use{' '}
          <code className="rounded bg-slate-100 px-1">{`{{dias_atraso}}`}</code> para o número de
          dias em atraso. O fallback genérico é usado quando não houver template específico da
          janela.
        </p>
      </div>

      <ChargeMessageTemplatesSection
        title="Fallback genérico (subscriptionOverdue)"
        value={{ templates: normalizedValue.generic.templates, delayMs }}
        onChange={(next) => updateGeneric(next.templates)}
        previewContext={buildOverdueChargeMessagePreviewContext(7)}
        showDelay={false}
      />

      {sortedWindows.map((day) => (
        <div key={day} className="border-t border-slate-200 pt-6">
          <ChargeMessageTemplatesSection
            title={`Janela D+${day} (subscriptionOverdueDay${day})`}
            value={{
              templates:
                normalizedValue.byWindow[day]?.templates ??
                buildDefaultOverdueChargeMessages().byWindow[day]?.templates ??
                normalizedValue.generic.templates,
              delayMs,
            }}
            onChange={(next) => updateWindow(day, next.templates)}
            previewContext={buildOverdueChargeMessagePreviewContext(day)}
            showDelay={false}
          />
        </div>
      ))}

      <p className="text-xs text-slate-500">
        O intervalo entre mensagens usa o mesmo delay configurado em Mensagens — assinatura (
        {(delayMs / 1000).toLocaleString('pt-BR')}s).
      </p>
    </div>
  );
};

import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_OVERDUE_REMINDER_MESSAGE_TEMPLATES,
  buildDefaultOverdueChargeMessages,
  buildOverdueChargeMessagePreviewContext,
  extractOverdueReminderDays,
  type OverdueChargeMessagesDto,
  type OverdueReminderWindowDto,
} from '@client-manager/shared';
import { ChargeMessageTemplatesSection } from './ChargeMessageTemplatesSection';

interface OverdueChargeMessageTemplatesSectionProps {
  value: OverdueChargeMessagesDto;
  onChange: (value: OverdueChargeMessagesDto) => void;
  delayMs: number;
}

function suggestNextWindowDay(windows: OverdueReminderWindowDto[]): number {
  if (windows.length === 0) {
    return 1;
  }

  const sorted = [...windows].sort((a, b) => a.daysAfterDue - b.daysAfterDue);
  return sorted[sorted.length - 1].daysAfterDue + 1;
}

function findDuplicateDayIndex(windows: OverdueReminderWindowDto[], day: number, skipIndex: number): number {
  return windows.findIndex((window, index) => index !== skipIndex && window.daysAfterDue === day);
}

function formatDaysLabel(days: number): string {
  return days === 1 ? '1 dia após o vencimento' : `${days} dias após o vencimento`;
}

/**
 * Unified editor for overdue reminder windows: each item defines dispatch day + WhatsApp templates.
 */
export const OverdueChargeMessageTemplatesSection: React.FC<
  OverdueChargeMessageTemplatesSectionProps
> = ({ value, onChange, delayMs }) => {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0);
  const [showGenericFallback, setShowGenericFallback] = React.useState(false);
  const [dayDrafts, setDayDrafts] = React.useState<Record<number, string>>({});

  const windows = value.windows.length > 0 ? value.windows : buildDefaultOverdueChargeMessages().windows;

  const updateWindows = (nextWindows: OverdueReminderWindowDto[]) => {
    onChange({
      ...value,
      windows: nextWindows,
    });
  };

  const updateWindow = (index: number, patch: Partial<OverdueReminderWindowDto>) => {
    const next = windows.map((window, itemIndex) =>
      itemIndex === index ? { ...window, ...patch } : window,
    );
    updateWindows(next);
  };

  const updateWindowDaysDraft = (index: number, raw: string) => {
    setDayDrafts((current) => ({ ...current, [index]: raw }));
  };

  const commitWindowDays = (index: number) => {
    const raw = dayDrafts[index];
    if (raw === undefined) {
      return;
    }

    const parsed = Number(raw);
    setDayDrafts((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });

    if (!Number.isInteger(parsed) || parsed < 1) {
      return;
    }

    if (findDuplicateDayIndex(windows, parsed, index) >= 0) {
      return;
    }

    updateWindow(index, { daysAfterDue: parsed });
  };

  const removeWindow = (index: number) => {
    if (windows.length <= 1) {
      return;
    }

    const next = windows.filter((_, itemIndex) => itemIndex !== index);
    updateWindows(next);
    setExpandedIndex((current) => {
      if (current === null) return null;
      if (current === index) return Math.max(0, index - 1);
      if (current > index) return current - 1;
      return current;
    });
  };

  const addWindow = () => {
    const nextDay = suggestNextWindowDay(windows);
    const next: OverdueReminderWindowDto = {
      daysAfterDue: nextDay,
      templates: [...DEFAULT_OVERDUE_REMINDER_MESSAGE_TEMPLATES],
    };
    updateWindows([...windows, next]);
    setExpandedIndex(windows.length);
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndex((current) => (current === index ? null : index));
  };

  const configuredDays = extractOverdueReminderDays({ ...value, windows });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Mensagens — pós-vencimento (D+N)</h3>
        <p className="mt-1 text-xs text-slate-600">
          Adicione quantas janelas precisar. Cada janela define{' '}
          <strong>quantos dias após o vencimento</strong> o WhatsApp será enviado e quais mensagens
          usar. Placeholder{' '}
          <code className="rounded bg-slate-100 px-1">{`{{dias_atraso}}`}</code> reflete o dia da
          janela na prévia.
        </p>
        {configuredDays.length > 0 ? (
          <p className="mt-2 text-xs font-medium text-indigo-700">
            Janelas ativas: {configuredDays.map((day) => `D+${day}`).join(' · ')}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {windows.map((window, index) => {
          const isExpanded = expandedIndex === index;
          const draftDay = dayDrafts[index];
          const displayDay = draftDay !== undefined ? draftDay : String(window.daysAfterDue);
          const parsedDisplayDay = Number(displayDay);
          const hasDuplicateDay =
            Number.isInteger(parsedDisplayDay) &&
            parsedDisplayDay >= 1 &&
            findDuplicateDayIndex(windows, parsedDisplayDay, index) >= 0;

          return (
            <article
              key={index}
              className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/80 shadow-sm"
            >
              <header className="border-b border-slate-100 px-3 py-3 sm:px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span className="text-xs font-medium text-slate-800 sm:text-sm">Disparar</span>
                        <span className="text-[10px] font-bold uppercase text-indigo-600 sm:text-xs">
                          D+
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={displayDay}
                          onChange={(e) => updateWindowDaysDraft(index, e.target.value)}
                          onBlur={() => commitWindowDays(index)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitWindowDays(index);
                            }
                          }}
                          aria-label={`Dias após vencimento da janela ${index + 1}`}
                          className={`w-14 rounded-md border px-1.5 py-1 text-center text-sm font-semibold sm:w-16 sm:px-2 sm:py-1.5 ${
                            hasDuplicateDay
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : 'border-indigo-200 bg-white text-slate-900'
                          }`}
                        />
                        <span className="text-[11px] text-slate-500 sm:text-xs">dias após venc.</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                        {hasDuplicateDay
                          ? 'Dia já usado em outra janela.'
                          : formatDaysLabel(
                              Number.isInteger(parsedDisplayDay)
                                ? parsedDisplayDay
                                : window.daysAfterDue,
                            )}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => removeWindow(index)}
                      disabled={windows.length <= 1}
                      className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Remover janela ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(index)}
                      className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 sm:gap-1 sm:px-2.5 sm:text-xs"
                    >
                      {isExpanded ? (
                        <>
                          Recolher
                          <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Editar
                          <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </header>

              {isExpanded ? (
                <div className="border-t border-slate-100 bg-white px-4 py-4">
                  <ChargeMessageTemplatesSection
                    title={`Mensagens da janela D+${window.daysAfterDue}`}
                    value={{ templates: window.templates, delayMs }}
                    onChange={(next) => updateWindow(index, { templates: next.templates })}
                    previewContext={buildOverdueChargeMessagePreviewContext(window.daysAfterDue)}
                    showDelay={false}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addWindow}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-3 text-sm font-semibold text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        Adicionar janela
      </button>

      <div className="rounded-lg border border-slate-200 bg-slate-50/80">
        <button
          type="button"
          onClick={() => setShowGenericFallback((current) => !current)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700"
        >
          Fallback genérico (opcional)
          {showGenericFallback ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>
        {showGenericFallback ? (
          <div className="border-t border-slate-200 px-4 py-4">
            <p className="mb-3 text-xs text-slate-500">
              Usado apenas se não existir template para o dia configurado na janela.
            </p>
            <ChargeMessageTemplatesSection
              title="Fallback genérico (subscriptionOverdue)"
              value={{ templates: value.generic.templates, delayMs }}
              onChange={(next) => onChange({ ...value, windows, generic: { templates: next.templates } })}
              previewContext={buildOverdueChargeMessagePreviewContext(7)}
              showDelay={false}
            />
          </div>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        Intervalo entre mensagens da mesma janela:{' '}
        {(delayMs / 1000).toLocaleString('pt-BR')}s (herda de Mensagens — assinatura).
      </p>
    </div>
  );
};

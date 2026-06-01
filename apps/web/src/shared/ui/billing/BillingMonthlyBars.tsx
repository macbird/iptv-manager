import React from 'react';
import { formatCents } from './format-billing';

export interface MonthlyBillingPoint {
  month: string;
  label: string;
  issuedCents: number;
  receivedCents: number;
  invoiceCount: number;
  paidCount: number;
}

interface BillingMonthlyBarsProps {
  data: MonthlyBillingPoint[];
  title?: string;
}

export const BillingMonthlyBars: React.FC<BillingMonthlyBarsProps> = ({
  data,
  title = 'Receita — últimos 6 meses',
}) => {
  const maxValue = Math.max(...data.map((d) => Math.max(d.issuedCents, d.receivedCents)), 1);

  return (
    <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-slate-300" />
            Emitido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
            Recebido
          </span>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-5">
        <div className="flex items-end justify-between gap-2 sm:gap-3 h-40">
          {data.map((point) => {
            const issuedPct = (point.issuedCents / maxValue) * 100;
            const receivedPct = (point.receivedCents / maxValue) * 100;
            const rate =
              point.invoiceCount > 0
                ? Math.round((point.paidCount / point.invoiceCount) * 100)
                : 0;

            return (
              <div key={point.month} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-0.5 h-28">
                  <div
                    className="w-[42%] max-w-5 bg-slate-200 rounded-t transition-all"
                    style={{ height: `${Math.max(issuedPct, 4)}%` }}
                    title={`Emitido: ${formatCents(point.issuedCents)}`}
                  />
                  <div
                    className="w-[42%] max-w-5 bg-emerald-500 rounded-t transition-all"
                    style={{ height: `${Math.max(receivedPct, 4)}%` }}
                    title={`Recebido: ${formatCents(point.receivedCents)}`}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 truncate w-full text-center">
                  {point.label}
                </span>
                <span className="text-[9px] text-slate-400">{rate}% pago</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-4">
          <div>
            <p className="text-slate-500">Total emitido (6m)</p>
            <p className="font-semibold text-slate-900">
              {formatCents(data.reduce((s, d) => s + d.issuedCents, 0))}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Total recebido (6m)</p>
            <p className="font-semibold text-emerald-700">
              {formatCents(data.reduce((s, d) => s + d.receivedCents, 0))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

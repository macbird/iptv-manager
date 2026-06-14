import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { AppRouteState } from '../../hooks/useListFiltersFromRouteState';
import { formatCents, formatPaymentMethod } from './format-billing';

export interface RecentPaymentItem {
  id: string;
  amountCents: number;
  method: string;
  paidAt: string;
  billingCycleKey: string;
  customerName?: string | null;
  accountName?: string | null;
}

interface RecentPaymentsListProps {
  payments: RecentPaymentItem[];
  paymentsHref: string;
  paymentsLinkState?: AppRouteState;
  emptyLabel?: string;
}

export const RecentPaymentsList: React.FC<RecentPaymentsListProps> = ({
  payments,
  paymentsHref,
  paymentsLinkState,
  emptyLabel = 'Nenhum pagamento registrado.',
}) => {
  return (
    <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Pagamentos recentes</h2>
        <Link
          to={paymentsHref}
          state={paymentsLinkState}
          className="text-sm text-form-primary hover:text-form-primary-hover flex items-center gap-1"
        >
          Ver todos <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {payments.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {p.customerName ?? p.accountName ?? '—'}
                </p>
                <p className="text-xs text-slate-500">
                  {formatPaymentMethod(p.method)} · {p.billingCycleKey}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm font-semibold text-emerald-700">{formatCents(p.amountCents)}</p>
                <p className="text-[10px] text-slate-400">
                  {new Date(p.paidAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-8 text-sm text-slate-500 text-center">{emptyLabel}</p>
      )}
    </section>
  );
};

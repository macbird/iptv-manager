import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatCents } from './format-billing';

export interface PendingActivationItem {
  id: string;
  connectionCount: number;
  paidAt: string;
  customer: { id: string; name: string };
  payment: { amountCents: number };
}

interface PendingActivationsListProps {
  activations: PendingActivationItem[];
  activationsHref?: string;
  emptyLabel?: string;
}

export const PendingActivationsList: React.FC<PendingActivationsListProps> = ({
  activations,
  activationsHref = '/activations',
  emptyLabel = 'Nenhuma ativação pendente.',
}) => {
  const connectionLabel = (count: number) =>
    count === 1 ? '1 conexão' : `${count} conexões`;

  return (
    <section className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Ativações pendentes</h2>
        <Link
          to={activationsHref}
          className="text-sm text-form-primary hover:text-form-primary-hover flex items-center gap-1"
        >
          Ver todas <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {activations.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {activations.map((activation) => (
            <li key={activation.id}>
              <Link
                to={activationsHref}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {activation.customer.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {connectionLabel(activation.connectionCount)} · renovar no servidor
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-amber-700">
                    {formatCents(activation.payment.amountCents)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Pago em {new Date(activation.paidAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-8 text-sm text-slate-500 text-center">{emptyLabel}</p>
      )}
    </section>
  );
};

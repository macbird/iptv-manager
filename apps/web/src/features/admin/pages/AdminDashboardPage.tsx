import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  UserCheck,
  ShieldAlert,
  Wallet,
  Receipt,
  FileWarning,
  TrendingUp,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { adminDashboardApi } from '../api/admin.api';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { StatCard } from '../../../shared/ui/layout/StatCard';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { BillingMonthlyBars } from '../../../shared/ui/billing/BillingMonthlyBars';
import { RecentPaymentsList } from '../../../shared/ui/billing/RecentPaymentsList';
import { formatCents } from '../../../shared/ui/billing/format-billing';

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminDashboardApi.getStats,
  });

  if (isLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="relative h-64">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  const billing = stats?.billing;

  const accountCards = [
    {
      title: 'Total de contas',
      value: stats?.totalAccounts ?? 0,
      subtitle: 'Tenants na plataforma',
      icon: Building2,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      href: '/admin/accounts',
    },
    {
      title: 'Contas ativas',
      value: stats?.activeAccounts ?? 0,
      icon: UserCheck,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      href: '/admin/accounts',
    },
    {
      title: 'Contas desativadas',
      value: stats?.inactiveAccounts ?? 0,
      icon: ShieldAlert,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      href: '/admin/accounts',
    },
    {
      title: 'Total de usuários',
      value: stats?.totalUsers ?? 0,
      subtitle: 'Proprietários e equipe',
      icon: Users,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
    },
  ];

  const billingCards = [
    {
      title: 'MRR esperado',
      value: formatCents(stats?.expectedMrrCents ?? 0),
      subtitle: `${stats?.activeSubscriptions ?? 0} assinaturas ativas`,
      icon: CreditCard,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      href: '/admin/settings',
    },
    {
      title: 'Recebido no mês',
      value: formatCents(billing?.receivedCurrentMonthCents ?? 0),
      subtitle: 'SaaS — pagamentos confirmados',
      icon: Wallet,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      href: '/admin/payments',
    },
    {
      title: 'Faturas em aberto',
      value: billing?.openInvoices ?? 0,
      subtitle: formatCents(billing?.openAmountCents ?? 0),
      icon: Receipt,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      href: '/admin/invoices',
    },
    {
      title: 'Faturas vencidas',
      value: billing?.overdueInvoices ?? 0,
      subtitle: 'Assinaturas em atraso',
      icon: FileWarning,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      href: '/admin/invoices',
    },
    {
      title: 'Taxa de cobrança',
      value: `${billing?.collectionRate ?? 0}%`,
      subtitle: 'Ciclo SaaS atual',
      icon: TrendingUp,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-100',
      href: '/admin/invoices',
    },
  ];

  return (
    <PageLayout title="Dashboard">
      <p className="text-slate-600 mb-6">
        Visão da plataforma — contas, assinaturas SaaS e progressão de cobrança.
      </p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Contas
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {accountCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Cobrança SaaS
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          {billingCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      {stats?.monthlyBilling && stats.monthlyBilling.length > 0 && (
        <div className="mb-8">
          <BillingMonthlyBars
            data={stats.monthlyBilling}
            title="Receita SaaS — últimos 6 meses"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats?.recentPayments && (
          <RecentPaymentsList
            payments={stats.recentPayments}
            paymentsHref="/admin/payments"
            emptyLabel="Nenhum pagamento SaaS registrado. Execute npm run seed:billing em apps/api."
          />
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
          <h2 className="text-base font-semibold text-slate-900 lg:text-lg">Visão geral da plataforma</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Gerencie tenants, assinaturas e cobrança SaaS. O gráfico reflete faturas e pagamentos dos
            últimos 6 meses gerados pelo seed de billing.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/admin/invoices"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Faturas SaaS <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/payments"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Pagamentos <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/settings"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Configurações <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

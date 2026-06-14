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
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import { adminDashboardApi } from '../api/admin.api';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { StatCard } from '../../../shared/ui/layout/StatCard';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { BillingMonthlyBars } from '../../../shared/ui/billing/BillingMonthlyBars';
import { RecentPaymentsList } from '../../../shared/ui/billing/RecentPaymentsList';
import { formatCents } from '../../../shared/ui/billing/format-billing';
import {
  dashboardInvoiceListFilters,
  dashboardPaymentListFilters,
} from '../../../shared/utils/dashboard-list-filters';

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
  const health = stats?.health;

  const healthCards = [
    {
      title: 'MP plataforma',
      value: health?.platformMercadoPagoConfigured ? 'OK' : 'Pendente',
      subtitle: health?.platformMercadoPagoConfigured
        ? 'Token Mercado Pago salvo'
        : 'Configure em Configurações → Pagamentos',
      icon: CreditCard,
      iconColor: health?.platformMercadoPagoConfigured ? 'text-emerald-600' : 'text-amber-600',
      iconBg: health?.platformMercadoPagoConfigured ? 'bg-emerald-100' : 'bg-amber-100',
      href: '/admin/settings',
    },
    {
      title: 'WhatsApp plataforma',
      value: health?.platformWhatsappConnected ? 'Conectado' : 'Desconectado',
      subtitle: 'Cobrança automática às revendas',
      icon: MessageCircle,
      iconColor: health?.platformWhatsappConnected ? 'text-emerald-600' : 'text-amber-600',
      iconBg: health?.platformWhatsappConnected ? 'bg-emerald-100' : 'bg-amber-100',
      href: '/admin/settings',
    },
    {
      title: 'Anomalias Evolution',
      value: health?.evolutionAnomalyAccounts ?? 0,
      subtitle: 'Instâncias presas ou com status divergente',
      icon: AlertTriangle,
      iconColor: (health?.evolutionAnomalyAccounts ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600',
      iconBg: (health?.evolutionAnomalyAccounts ?? 0) > 0 ? 'bg-red-100' : 'bg-emerald-100',
      href: '/admin/accounts',
    },
    {
      title: 'Tenants sem MP',
      value: health?.activeTenantsWithoutMercadoPago ?? 0,
      subtitle: 'Contas ativas sem PIX configurado',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      href: '/admin/accounts',
    },
    {
      title: 'Tenants sem telefone',
      value: health?.activeTenantsWithoutPhone ?? 0,
      subtitle: 'Dificulta cobrança WhatsApp da plataforma',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      href: '/admin/accounts',
    },
  ];

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
      iconColor: 'text-form-primary',
      iconBg: 'bg-form-primary/10',
      href: '/admin/settings',
    },
    {
      title: 'Recebido no mês',
      value: formatCents(billing?.receivedCurrentMonthCents ?? 0),
      subtitle: 'Pagamentos confirmados',
      icon: Wallet,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      href: '/admin/payments',
      linkState: { listFilters: dashboardPaymentListFilters.currentMonth },
    },
    {
      title: 'Faturas em aberto',
      value: billing?.openInvoices ?? 0,
      subtitle: formatCents(billing?.openAmountCents ?? 0),
      icon: Receipt,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      href: '/admin/invoices',
      linkState: { listFilters: dashboardInvoiceListFilters.open },
    },
    {
      title: 'Faturas vencidas',
      value: billing?.overdueInvoices ?? 0,
      subtitle: formatCents(billing?.overdueAmountCents ?? 0),
      icon: FileWarning,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      href: '/admin/invoices',
      linkState: { listFilters: dashboardInvoiceListFilters.overdue },
    },
    {
      title: 'Taxa de cobrança',
      value: `${billing?.collectionRate ?? 0}%`,
      subtitle: 'Ciclo atual',
      icon: TrendingUp,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-100',
      href: '/admin/invoices',
      linkState: { listFilters: dashboardInvoiceListFilters.currentCycle },
    },
  ];

  return (
    <PageLayout title="Dashboard">
      <p className="text-slate-600 mb-6">
        Visão da plataforma — contas, assinaturas e progressão de cobrança.
      </p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Saúde operacional
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          {healthCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </section>

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
          Cobrança
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
            title="Receita — últimos 6 meses"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats?.recentPayments && (
          <RecentPaymentsList
            payments={stats.recentPayments}
            paymentsHref="/admin/payments"
            paymentsLinkState={{ listFilters: dashboardPaymentListFilters.currentMonth }}
            emptyLabel="Nenhum pagamento registrado. Execute npm run seed:billing em apps/api."
          />
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
          <h2 className="text-base font-semibold text-slate-900 lg:text-lg">Visão geral da plataforma</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Gerencie tenants, assinaturas e cobrança. O gráfico reflete faturas e pagamentos dos
            últimos 6 meses gerados pelo seed de billing.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/admin/invoices"
              state={{ listFilters: dashboardInvoiceListFilters.canceled }}
              className="inline-flex items-center gap-1 text-sm font-medium text-form-primary hover:text-form-primary-hover"
            >
              Faturas canceladas <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/invoices"
              className="inline-flex items-center gap-1 text-sm font-medium text-form-primary hover:text-form-primary-hover"
            >
              Faturas <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/payments"
              className="inline-flex items-center gap-1 text-sm font-medium text-form-primary hover:text-form-primary-hover"
            >
              Pagamentos <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/settings"
              className="inline-flex items-center gap-1 text-sm font-medium text-form-primary hover:text-form-primary-hover"
            >
              Configurações <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CalendarClock,
  AlertTriangle,
  CreditCard,
  Server,
  Plug,
  DollarSign,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboard.api';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { StatCard } from '../../../shared/ui/layout/StatCard';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

export const DashboardPage: React.FC = () => {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: expirations, isLoading: expirationsLoading } = useQuery({
    queryKey: ['dashboard-expirations'],
    queryFn: () => dashboardApi.getUpcomingExpirations(5),
    enabled: !statsError,
  });

  if (statsLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="relative h-64">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  if (statsError) {
    const axiosErr = statsError as { response?: unknown };
    const isNetworkError = !axiosErr?.response;
    return (
      <PageLayout title="Dashboard">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center max-w-lg mx-auto mt-8">
          <p className="text-sm font-medium text-amber-900">
            {isNetworkError
              ? 'Não foi possível conectar à API.'
              : 'Erro ao carregar o dashboard.'}
          </p>
          <p className="text-xs text-amber-800 mt-2">
            {isNetworkError ? (
              <>
                Verifique se o servidor está rodando em{' '}
                <code className="bg-amber-100 px-1 rounded">npm run api:dev</code> (porta 3001).
              </>
            ) : (
              <>
                Se o banco foi renomeado para <code className="bg-amber-100 px-1">client_manager</code>,
                rode <code className="bg-amber-100 px-1">npx prisma migrate deploy</code> em{' '}
                <code className="bg-amber-100 px-1">apps/api</code>.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => refetchStats()}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Tentar novamente
          </button>
        </div>
      </PageLayout>
    );
  }

  const kpiCards = [
    {
      title: 'Total de clientes',
      value: stats?.totalCustomers ?? 0,
      subtitle: 'Base cadastrada',
      icon: Users,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      href: '/customers',
    },
    {
      title: 'Clientes ativos',
      value: stats?.activeCustomers ?? 0,
      subtitle: `${stats?.inactiveCustomers ?? 0} inativos`,
      icon: UserCheck,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      href: '/customers',
    },
    {
      title: 'Vencendo em 7 dias',
      value: stats?.expiringSoon ?? 0,
      subtitle: 'Renovar em breve',
      icon: CalendarClock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      href: '/customers',
    },
    {
      title: 'Vencidos',
      value: stats?.expired ?? 0,
      subtitle: 'Ação necessária',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      href: '/customers',
    },
  ];

  const infraCards = [
    {
      title: 'Planos',
      value: stats?.totalPlans ?? 0,
      icon: CreditCard,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-100',
      href: '/plans',
    },
    {
      title: 'Servidores',
      value: stats?.totalServers ?? 0,
      icon: Server,
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
      href: '/servers',
    },
    {
      title: 'Conexões',
      value: stats?.totalConnections ?? 0,
      subtitle: 'MACs cadastrados',
      icon: Plug,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-100',
      href: '/customers',
    },
    {
      title: 'Receita mensal estimada',
      value: formatCurrency(stats?.estimatedMrr ?? 0),
      subtitle: 'Soma dos planos dos ativos',
      icon: DollarSign,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
  ];

  return (
    <PageLayout title="Dashboard" noPadding>
      <div className="w-full px-4 py-4 lg:px-6 lg:py-6">
        <p className="text-slate-600 mb-6">
          Visão geral da sua operação — clientes, vencimentos e infraestrutura.
        </p>

        {/* Mobile: 2 colunas por seção */}
        <div className="space-y-8 lg:hidden">
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Clientes e cobrança
            </h2>
            <div className="grid grid-cols-2 gap-3 w-full">
              {kpiCards.map((card) => (
                <StatCard key={card.title} {...card} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Infraestrutura e receita
            </h2>
            <div className="grid grid-cols-2 gap-3 w-full">
              {infraCards.map((card) => (
                <StatCard key={card.title} {...card} />
              ))}
            </div>
          </section>
        </div>

        {/* Desktop: 6 colunas ocupando toda a largura (última linha com 2 cards em col-span-3) */}
        <div className="hidden lg:block space-y-10 mb-10">
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Clientes e cobrança
            </h2>
            <div className="grid grid-cols-6 gap-4 w-full">
              {kpiCards.map((card, index) => (
                <div
                  key={card.title}
                  className={`min-w-0 ${index < 2 ? 'col-span-2' : 'col-span-1'}`}
                >
                  <StatCard {...card} />
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Infraestrutura e receita
            </h2>
            <div className="grid grid-cols-6 gap-4 w-full">
              {infraCards.map((card, index) => (
                <div
                  key={card.title}
                  className={`min-w-0 ${index < 2 ? 'col-span-2' : 'col-span-1'}`}
                >
                  <StatCard {...card} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <section className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Próximos vencimentos</h2>
            <Link
              to="/customers"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {expirationsLoading ? (
            <div className="relative h-32">
              <LoadingSpinner />
            </div>
          ) : expirations && expirations.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {expirations.map((customer) => (
                <li key={customer.id}>
                  <Link
                    to={`/customers/${customer.id}/edit`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{customer.name}</p>
                      <p className="text-xs text-slate-500">
                        {customer.plan?.name ?? 'Sem plano'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-amber-700">
                        {formatDate(customer.expiresAt)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        {customer.status}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-500 text-center">
              Nenhum vencimento futuro cadastrado.
            </p>
          )}
        </section>

        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Ações rápidas</h2>
          <div className="space-y-2">
            <Link
              to="/customers/new"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo cliente
            </Link>
            <Link
              to="/customers"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Users className="w-4 h-4" />
              Gerenciar clientes
            </Link>
            <Link
              to="/plans/new"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Novo plano
            </Link>
            <Link
              to="/servers/new"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Server className="w-4 h-4" />
              Novo servidor
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed">
              Cards clicáveis levam às listas correspondentes. A receita estimada soma o
              preço mensal dos planos dos clientes com status ativo.
            </p>
          </div>
        </section>
        </div>
      </div>
    </PageLayout>
  );
};

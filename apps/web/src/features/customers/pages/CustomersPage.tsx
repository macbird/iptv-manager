import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import { CardList, EntityCard } from '../../../shared/ui/lists/EntityCard';
import { Plus, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomSheet } from '../../../shared/ui/modals/BottomSheet';
import { useCrud } from '../../../shared/hooks/useCrud';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.list,
  });

  const { remove } = useCrud({
    queryKey: ['customers'],
    deleteFn: customersApi.delete,
    listPath: '/customers',
    entityName: 'Cliente',
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link 
          to="/customers/new"
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-5 w-5" />
          Novo Cliente
        </Link>
      </div>

      <CardList>
        {customers?.map((customer: any) => (
          <EntityCard
            key={customer.id}
            icon={<Users className="h-5 w-5" />}
            title={customer.name}
            subtitle={customer.email}
            status={customer.status}
            footer={
              <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase">Plano:</span>
                  <span className="text-slate-700 font-semibold">{customer.plan?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase">Servidor:</span>
                  <span className="text-slate-700 font-semibold">{customer.server?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase">Conexões:</span>
                  <span className="text-slate-700 font-semibold">{customer.connections}</span>
                </div>
                {customer.expiresAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Vencimento:</span>
                    <span className="text-slate-700 font-semibold">{new Date(customer.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 font-medium">
                  {customer.phone || 'Sem telefone'}
                </div>
              </div>
            }
            onEdit={() => navigate(`/customers/${customer.id}/edit`)}
            onDelete={() => setDeleteId(customer.id)}
          />
        ))}
      </CardList>

      {customers?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Nenhum cliente cadastrado.</p>
        </div>
      )}

      <BottomSheet 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não poderá ser desfeita."
      />
    </div>
  );
};

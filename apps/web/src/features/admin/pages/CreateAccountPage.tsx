import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { tenantsApi } from '../api/admin.api';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { useCrud } from '../../../shared/hooks/useCrud';

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  
  const { create } = useCrud<any, any>({
    queryKey: ['accounts'],
    createFn: tenantsApi.create,
    listPath: '/admin/accounts',
    entityName: 'Conta',
  });

  const onSubmit = async (data: any) => {
    await create(data);
  };

  return (
    <FormLayout title="Nova Conta">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome da Empresa/Revenda</label>
            <input
              {...register('name', { required: true })}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
              placeholder="Ex: Revenda Master"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Slug (URL)</label>
            <input
              {...register('slug')}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
              placeholder="ex: revenda-master"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 mt-6">
          <h3 className="text-md font-semibold text-slate-800 mb-4">Dados do Proprietário</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome do Usuário</label>
              <input
                {...register('ownerName', { required: true })}
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">E-mail de Acesso</label>
              <input
                type="email"
                {...register('ownerEmail', { required: true })}
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
                placeholder="joao@email.com"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Senha Inicial (Opcional)</label>
            <input
              type="password"
              {...register('initialPassword')}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
              placeholder="Mudar123! (padrão se vazio)"
            />
            <p className="text-xs text-slate-500 mt-1">O usuário será obrigado a trocar esta senha no primeiro login.</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={() => navigate('/admin/accounts')}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? 'Criando...' : 'Criar Conta'}
          </button>
        </div>
      </form>
    </FormLayout>
  );
};

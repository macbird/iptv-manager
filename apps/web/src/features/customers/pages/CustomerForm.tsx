import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, type CustomerInput } from '@iptv-manager/shared';
import { PatternFormat } from 'react-number-format';
import { useQuery } from '@tanstack/react-query';
import { plansApi } from '../../plans/api/plans.api';
import { serversApi } from '../../servers/api/servers.api';

interface CustomerFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<any>;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<any>({
    // Temporarily disable strict resolver to allow new fields not yet in shared schema
    // resolver: zodResolver(customerSchema),
    defaultValues: {
      status: 'active',
      connections: 1,
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list,
  });

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: serversApi.list,
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nome</label>
          <input
            {...register('name', { required: true })}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">Nome é obrigatório</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">E-mail</label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Telefone</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PatternFormat
                {...field}
                format="(##) #####-####"
                mask="_"
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Conexões</label>
          <input
            type="number"
            {...register('connections', { valueAsNumber: true, min: 1 })}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Plano</label>
          <select
            {...register('planId')}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          >
            <option value="">Selecione um plano</option>
            {plans?.map((plan: any) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Servidor</label>
          <select
            {...register('serverId')}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          >
            <option value="">Selecione um servidor</option>
            {servers?.map((server: any) => (
              <option key={server.id} value={server.id}>{server.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Data de Vencimento</label>
        <input
          type="date"
          {...register('expiresAt')}
          className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Observações</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
        <div className="flex gap-4">
          {(['active', 'inactive'] as const).map((status) => (
            <label key={status} className="flex items-center cursor-pointer">
              <input
                type="radio"
                {...register('status')}
                value={status}
                className="sr-only peer"
              />
              <div className="px-4 py-2 rounded-full border text-sm font-medium transition-colors bg-slate-100 text-slate-600 border-slate-200 peer-checked:bg-indigo-600 peer-checked:text-white">
                {status === 'active' ? 'Ativo' : 'Inativo'}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

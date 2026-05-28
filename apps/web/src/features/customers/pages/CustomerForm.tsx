import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, type CustomerInput } from '@iptv-manager/shared';
import { PatternFormat } from 'react-number-format';

interface CustomerFormProps {
  onSubmit: (data: CustomerInput) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CustomerInput>;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      status: 'active',
    },
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Nome</label>
        <input
          {...register('name')}
          className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">E-mail</label>
        <input
          type="email"
          {...register('email')}
          className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

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
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
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

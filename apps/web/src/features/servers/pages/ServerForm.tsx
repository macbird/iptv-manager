import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TagInputChips } from '../../../shared/ui/forms/TagInputChips';

interface ServerFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<any>;
}

export const ServerForm = React.forwardRef<HTMLFormElement, ServerFormProps>(
  ({ onSubmit, onCancel, initialData }, ref) => {
    const {
      register,
      handleSubmit,
      reset,
      control,
      formState: { errors },
    } = useForm<any>({
      defaultValues: {
        status: 'active',
        tags: [],
      },
    });

    React.useEffect(() => {
      if (initialData) {
        reset({
          ...initialData,
          tags: initialData.tags || [],
        });
      }
    }, [initialData, reset]);

    const onSubmitHandler = handleSubmit(async (data) => {
      await onSubmit({
        ...data,
        tagIds: (data.tags ?? []).map((t: { id: string }) => t.id),
      });
    });

    return (
      <form ref={ref} onSubmit={onSubmitHandler} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nome</label>
          <input
            {...register('name', { required: true })}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">URL do Painel</label>
          <input
            type="url"
            {...register('panelUrl', { required: true })}
            placeholder="https://exemplo.com"
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          />
          {errors.panelUrl && (
            <p className="text-red-500 text-xs mt-1">{errors.panelUrl.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Notas/Credenciais</label>
          <textarea
            {...register('panelNotes')}
            rows={3}
            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Conexões Máx.</label>
            <input
              type="number"
              {...register('maxConnections', { valueAsNumber: true })}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              {...register('status')}
              className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
            >
              <option value="active">Ativo</option>
              <option value="maintenance">Manutenção</option>
              <option value="full">Lotado</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TagInputChips
                scope="server"
                value={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </form>
    );
  },
);

ServerForm.displayName = 'ServerForm';

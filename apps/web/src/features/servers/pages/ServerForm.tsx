import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TagInputChips } from '../../../shared/ui/forms/TagInputChips';
import { formInputClass, formLabelClass, formSelectClass, formTextareaClass } from '../../../shared/ui/forms/form-styles';

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
          <label className="block">
            <span className={formLabelClass}>Nome</span>
            <input {...register('name', { required: true })} className={formInputClass} />
          </label>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block">
            <span className={formLabelClass}>URL do Painel</span>
            <input
              type="url"
              {...register('panelUrl', { required: true })}
              placeholder="https://exemplo.com"
              className={formInputClass}
            />
          </label>
          {errors.panelUrl && (
            <p className="text-red-500 text-xs mt-1">{errors.panelUrl.message}</p>
          )}
        </div>

        <div>
          <label className="block">
            <span className={formLabelClass}>Notas/Credenciais</span>
            <textarea {...register('panelNotes')} rows={3} className={formTextareaClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block">
              <span className={formLabelClass}>Conexões Máx.</span>
              <input
                type="number"
                {...register('maxConnections', { valueAsNumber: true })}
                className={formInputClass}
              />
            </label>
          </div>

          <div>
            <label className="block">
              <span className={formLabelClass}>Status</span>
              <select {...register('status')} className={formSelectClass}>
                <option value="active">Ativo</option>
                <option value="maintenance">Manutenção</option>
                <option value="full">Lotado</option>
              </select>
            </label>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <label className="block">
            <span className={`${formLabelClass} mb-2 block`}>Tags</span>
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
          </label>
        </div>
      </form>
    );
  },
);

ServerForm.displayName = 'ServerForm';

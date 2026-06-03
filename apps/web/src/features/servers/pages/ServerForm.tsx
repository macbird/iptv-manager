import React from 'react';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serverSchema, type ServerInput } from '@client-manager/shared';
import { TagInputChips } from '../../../shared/ui/forms/TagInputChips';
import { FormPasswordInput } from '../../../shared/ui/forms/FormPasswordInput';
import type { TagDto } from '../../tags/api/tags.api';
import { showToast } from '../../../shared/utils/toast';
import {
  formInputClass,
  formLabelClass,
  formSelectClass,
  formTextareaClass,
} from '../../../shared/ui/forms/form-styles';

const serverFormSchema = serverSchema.extend({
  tags: z.array(z.custom<TagDto>()).default([]),
  panelUsername: z.string().optional(),
  panelPassword: z.string().optional(),
});

type ServerFormValues = z.infer<typeof serverFormSchema>;

export type ServerFormPayload = ServerInput & { tagIds?: string[] };

type ServerDetail = Partial<ServerFormValues & { tags?: TagDto[]; id?: string }>;

interface ServerFormProps {
  formId: string;
  onSubmit: (data: ServerFormPayload) => Promise<void>;
  onCancel: () => void;
  initialData?: ServerDetail;
}

const emptyFormValues: ServerFormValues = {
  status: 'active',
  tags: [],
  name: '',
  panelUrl: '',
  panelUsername: '',
  panelPassword: '',
  panelNotes: '',
};

function sanitizeServerForForm(server: ServerDetail): ServerFormValues {
  return {
    ...emptyFormValues,
    name: server.name ?? '',
    panelUrl: server.panelUrl ?? '',
    panelUsername: server.panelUsername ?? '',
    panelPassword: server.panelPassword ?? '',
    panelNotes: server.panelNotes ?? '',
    maxConnections:
      server.maxConnections != null && Number.isFinite(Number(server.maxConnections))
        ? Number(server.maxConnections)
        : undefined,
    status: server.status ?? 'active',
    tags: server.tags ?? [],
  };
}

function toPayload(data: ServerFormValues, keepPasswordIfBlank: boolean): ServerFormPayload {
  const { tags, panelPassword, panelUsername, ...serverData } = data;
  const trimmedUsername = panelUsername?.trim() ?? '';
  const payload: ServerFormPayload = {
    ...serverData,
    name: serverData.name.trim(),
    panelNotes: serverData.panelNotes?.trim() || undefined,
    tagIds: tags.map((tag) => tag.id),
  };

  payload.panelUsername = trimmedUsername.length > 0 ? trimmedUsername : undefined;

  if (panelPassword && panelPassword.length > 0) {
    payload.panelPassword = panelPassword;
  } else if (!keepPasswordIfBlank) {
    payload.panelPassword = '';
  }

  return payload;
}

export const ServerForm = React.forwardRef<HTMLFormElement, ServerFormProps>(
  ({ formId, onSubmit, onCancel, initialData }, ref) => {
    const isEditing = Boolean(initialData?.id);
    const formValues = React.useMemo(
      () => (initialData ? sanitizeServerForForm(initialData) : undefined),
      [initialData],
    );

    const {
      register,
      handleSubmit,
      control,
      formState: { errors },
    } = useForm<ServerFormValues>({
      resolver: zodResolver(serverFormSchema),
      defaultValues: emptyFormValues,
      values: formValues,
    });

    const onSubmitWrapper = async (data: ServerFormValues) => {
      await onSubmit(toPayload(data, isEditing));
    };

    const onInvalid = (fieldErrors: FieldErrors<ServerFormValues>) => {
      const firstError = Object.values(fieldErrors)[0];
      showToast.error(
        firstError?.message?.toString() ?? 'Verifique os campos do formulário.',
      );
    };

    return (
      <form
        ref={ref}
        id={formId}
        noValidate
        onSubmit={handleSubmit(onSubmitWrapper, onInvalid)}
        className="space-y-4"
      >
        <div>
          <label className="block">
            <span className={formLabelClass}>Nome</span>
            <input {...register('name')} className={formInputClass} />
          </label>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block">
            <span className={formLabelClass}>URL do Painel</span>
            <input
              type="url"
              {...register('panelUrl')}
              placeholder="https://exemplo.com"
              className={formInputClass}
            />
          </label>
          {errors.panelUrl && (
            <p className="text-red-500 text-xs mt-1">{errors.panelUrl.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="panelUsername"
            control={control}
            render={({ field }) => (
              <label className="block">
                <span className={formLabelClass}>Usuário do painel</span>
                <input
                  ref={field.ref}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  autoComplete="off"
                  className={formInputClass}
                  onFocus={(e) => e.target.select()}
                />
                {errors.panelUsername && (
                  <p className="text-red-500 text-xs mt-1">{errors.panelUsername.message}</p>
                )}
              </label>
            )}
          />

          <Controller
            name="panelPassword"
            control={control}
            render={({ field }) => (
              <FormPasswordInput
                label="Senha do painel"
                placeholder={isEditing ? 'Deixe em branco para manter' : 'Senha de acesso'}
                error={errors.panelPassword?.message}
                name={field.name}
                ref={field.ref}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
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
                min={1}
                {...register('maxConnections', {
                  setValueAs: (value) => {
                    if (value === '' || value == null) return undefined;
                    const parsed = Number(value);
                    return Number.isFinite(parsed) ? parsed : undefined;
                  },
                })}
                className={formInputClass}
                onFocus={(e) => e.target.select()}
              />
            </label>
            {errors.maxConnections && (
              <p className="text-red-500 text-xs mt-1">{errors.maxConnections.message}</p>
            )}
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
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
            )}
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

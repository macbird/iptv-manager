import React from 'react';
import { useForm } from 'react-hook-form';
import { PasswordInput } from '../../../shared/ui/forms/PasswordInput';
import {
  formInputClass,
  formLabelClass,
  formSelectClass,
} from '../../../shared/ui/forms/form-styles';

export interface AccountCreateInput {
  name: string;
  slug?: string;
  ownerName: string;
  ownerEmail: string;
  initialPassword?: string;
}

export interface AccountEditInput {
  status: 'active' | 'suspended';
}

type AccountFormProps =
  | {
      mode: 'create';
      onSubmit: (data: AccountCreateInput) => Promise<void>;
      initialData?: never;
    }
  | {
      mode: 'edit';
      onSubmit: (data: AccountEditInput) => Promise<void>;
      initialData?: {
        id?: string;
        name?: string;
        slug?: string;
        status?: 'active' | 'suspended';
        users?: Array<{ name?: string; email?: string; role?: string }>;
      };
    };

export const AccountForm = React.forwardRef<HTMLFormElement, AccountFormProps>(
  ({ mode, onSubmit, initialData }, ref) => {
    const { register, handleSubmit, reset } = useForm();

    React.useEffect(() => {
      if (mode === 'edit' && initialData) {
        reset({
          name: initialData.name ?? '',
          slug: initialData.slug ?? '',
          status: initialData.status ?? 'active',
        });
      }
    }, [mode, initialData, reset]);

    const onSubmitHandler = handleSubmit(async (data) => {
      if (mode === 'create') {
        await onSubmit({
          name: data.name,
          slug: data.slug || undefined,
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
          initialPassword: data.initialPassword || undefined,
        });
        return;
      }
      await onSubmit({ status: data.status });
    });

    if (mode === 'edit') {
      return (
        <form ref={ref} onSubmit={onSubmitHandler} className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">{initialData?.name}</span>
            {initialData?.slug ? (
              <>
                <span className="mx-2 text-slate-300">·</span>
                <span className="font-mono text-xs">{initialData.slug}</span>
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className={formLabelClass}>Nome da conta</span>
              <input
                {...register('name')}
                disabled
                className={`${formInputClass} cursor-not-allowed bg-slate-100 text-slate-600`}
              />
            </label>
            <label className="block">
              <span className={formLabelClass}>Slug</span>
              <input
                {...register('slug')}
                disabled
                className={`${formInputClass} cursor-not-allowed bg-slate-100 font-mono text-slate-600`}
              />
            </label>
          </div>

          <div>
            <label className="block">
              <span className={formLabelClass}>Status da conta</span>
              <select {...register('status', { required: true })} className={`${formSelectClass} max-w-xs`}>
                <option value="active">Ativa</option>
                <option value="suspended">Suspensa</option>
              </select>
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Contas suspensas não conseguem fazer login no app do revendedor.
            </p>
          </div>

          {initialData?.users && initialData.users.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="mb-3 text-sm font-medium text-slate-900">Usuários da conta</h3>
              <ul className="space-y-2">
                {initialData.users.map((user, index) => (
                  <li
                    key={`${user.email}-${index}`}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-900">{user.name}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-slate-600">{user.email}</span>
                    {user.role ? (
                      <span className="ml-2 text-xs text-slate-400">({user.role})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      );
    }

    return (
      <form ref={ref} onSubmit={onSubmitHandler} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block">
              <span className={formLabelClass}>Nome da empresa/revenda</span>
              <input
                {...register('name', { required: true })}
                className={formInputClass}
                placeholder="Ex: Revenda Master"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className={formLabelClass}>Slug (URL)</span>
              <input
                {...register('slug')}
                className={formInputClass}
                placeholder="ex: revenda-master"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="mb-4 text-sm font-medium text-slate-900">Dados do proprietário</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block">
                <span className={formLabelClass}>Nome do usuário</span>
                <input
                  {...register('ownerName', { required: true })}
                  className={formInputClass}
                  placeholder="Ex: João Silva"
                />
              </label>
            </div>
            <div>
              <label className="block">
                <span className={formLabelClass}>E-mail de acesso</span>
                <input
                  type="email"
                  {...register('ownerEmail', { required: true })}
                  className={formInputClass}
                  placeholder="joao@email.com"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 max-w-md">
            <PasswordInput
              id="initialPassword"
              label="Senha inicial (opcional)"
              autoComplete="new-password"
              placeholder="Mudar123! (padrão se vazio)"
              registration={register('initialPassword', { minLength: 6 })}
            />
            <p className="mt-1 text-xs text-slate-500">
              O usuário será obrigado a trocar esta senha no primeiro login.
            </p>
          </div>
        </div>
      </form>
    );
  },
);

AccountForm.displayName = 'AccountForm';

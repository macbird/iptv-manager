import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { showToast } from '../../../shared/utils/toast';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { User, Lock, Mail } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm();
  const newPassword = watch('password');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
  });

  React.useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        email: profile.email,
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      showToast.success('Perfil atualizado com sucesso!');
      reset({ password: '', confirmPassword: '' }, { keepValues: true });
    },
    onError: () => {
      showToast.error('Erro ao atualizar perfil');
    }
  });

  const onSubmit = async (data: any) => {
    const payload: any = {
      name: data.name,
      email: data.email,
    };
    if (data.password) {
      payload.password = data.password;
    }
    updateMutation.mutate(payload);
  };

  if (isLoading) return <div className="p-6">Carregando perfil...</div>;

  return (
    <FormLayout title="Meu Perfil">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
              <p className="text-sm text-slate-500">{profile?.account?.name} • {profile?.role}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <User className="h-4 w-4 mr-2" /> Nome
              </label>
              <input
                {...register('name', { required: true })}
                className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Mail className="h-4 w-4 mr-2" /> E-mail
              </label>
              <input
                {...register('email', { required: true })}
                className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
              <Lock className="h-4 w-4 mr-2" /> Alterar Senha
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nova Senha (opcional)</label>
                <input
                  type="password"
                  {...register('password', { minLength: 6 })}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    validate: val => !newPassword || val === newPassword || 'As senhas não coincidem'
                  })}
                  className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </FormLayout>
  );
};

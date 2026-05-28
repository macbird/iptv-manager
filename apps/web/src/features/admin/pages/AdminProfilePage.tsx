import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAuthApi } from '../api/admin.api';
import { showToast } from '../../../shared/utils/toast';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { Shield, Lock, Mail } from 'lucide-react';

export const AdminProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm();
  const newPassword = watch('password');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-me'],
    queryFn: adminAuthApi.getProfile,
  });

  React.useEffect(() => {
    if (profile) {
      reset({
        email: profile.email,
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: adminAuthApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-me'] });
      showToast.success('Perfil administrativo atualizado!');
      reset({ password: '', confirmPassword: '' }, { keepValues: true });
    },
    onError: () => {
      showToast.error('Erro ao atualizar perfil admin');
    }
  });

  const onSubmit = async (data: any) => {
    const payload: any = {
      email: data.email,
    };
    if (data.password) {
      payload.password = data.password;
    }
    updateMutation.mutate(payload);
  };

  if (isLoading) return <div className="p-6">Carregando perfil admin...</div>;

  return (
    <FormLayout title="Perfil do Administrador">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Plataforma Admin</h2>
              <p className="text-sm text-slate-300">{profile?.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 flex items-center">
              <Mail className="h-4 w-4 mr-2" /> E-mail Administrativo
            </label>
            <input
              {...register('email', { required: true })}
              className="w-full max-w-md p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
            />
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
              <Lock className="h-4 w-4 mr-2" /> Alterar Senha de Acesso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nova Senha (opcional)</label>
                <input
                  type="password"
                  {...register('password', { minLength: 6 })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    validate: val => !newPassword || val === newPassword || 'As senhas não coincidem'
                  })}
                  className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Atualizando...' : 'Atualizar Credenciais'}
            </button>
          </div>
        </form>
      </div>
    </FormLayout>
  );
};

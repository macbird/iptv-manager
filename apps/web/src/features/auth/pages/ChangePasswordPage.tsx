import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { showToast } from '../../../shared/utils/toast';

export const ChangePasswordPage: React.FC = () => {
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm();
  const navigate = useNavigate();
  const password = watch('newPassword');

  const onSubmit = async (data: any) => {
    try {
      await authApi.changePassword(data.newPassword);
      showToast.success('Senha alterada com sucesso!');
      
      // Update stored user info if needed, or just redirect
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.passwordResetRequired = false;
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/dashboard');
    } catch (err) {
      showToast.error('Erro ao alterar senha');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Alterar Senha</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">
          Por segurança, você precisa definir uma nova senha no seu primeiro acesso.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
            <input
              type="password"
              {...register('newPassword', { required: true, minLength: 6 })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
            <input
              type="password"
              {...register('confirmPassword', { 
                required: true, 
                validate: value => value === password || 'As senhas não coincidem'
              })}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

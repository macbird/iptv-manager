import React from 'react';
import { useForm } from 'react-hook-form';
import { tenantsApi } from '../api/admin.api';
import { showToast } from '../../../shared/utils/toast';
import { Modal } from '../../../shared/ui/modals/Modal';
import { Key, Copy, Check } from 'lucide-react';
import Swal from 'sweetalert2';

interface ResetPasswordModalProps {
  userId: string | null;
  userName: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ userId, userName, onClose, onSuccess }) => {
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      password: 'Mudar' + Math.floor(1000 + Math.random() * 9000) + '!',
    }
  });

  const temporaryPassword = watch('password');

  const onSubmit = async (data: any) => {
    if (!userId) return;

    try {
      await tenantsApi.resetPassword(userId, data.password);
      
      onClose();
      onSuccess();

      // Show instructions alert
      Swal.fire({
        title: 'Senha Resetada!',
        html: `
          <div class="text-left space-y-4">
            <p>A senha de <b>${userName}</b> foi alterada com sucesso.</p>
            <div class="bg-slate-100 p-4 rounded-lg border border-slate-200 mt-4">
              <p class="text-sm font-bold text-slate-500 uppercase mb-1">Senha Provisória:</p>
              <code class="text-lg font-mono text-indigo-600">${data.password}</code>
            </div>
            <div class="mt-4 text-sm text-slate-600 italic">
              * O usuário será obrigado a trocar esta senha no próximo login.
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Copiar Instruções',
        confirmButtonColor: '#4f46e5',
        showCloseButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          const text = `Olá ${userName}, sua senha no IPTV Manager foi resetada.\n\nAcesso: https://seu-link.com/login\nSenha Provisória: ${data.password}\n\n(Você deverá alterar esta senha no primeiro acesso).`;
          navigator.clipboard.writeText(text);
          showToast.success('Instruções copiadas para a área de transferência!');
        }
      });
    } catch (err) {
      showToast.error('Erro ao resetar senha');
    }
  };

  return (
    <Modal isOpen={!!userId} onClose={onClose} title="Resetar Senha">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-slate-600">
          Defina uma senha provisória para <strong>{userName}</strong>. 
          Ele será obrigado a trocá-la no primeiro acesso.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Senha Provisória</label>
          <div className="relative">
            <input
              {...register('password', { required: true, minLength: 6 })}
              className="w-full p-2.5 border border-slate-300 rounded-lg pr-10 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <Key className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Processando...' : 'Confirmar Reset'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

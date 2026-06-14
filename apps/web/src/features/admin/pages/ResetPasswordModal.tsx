import React from 'react';
import { APP_NAME, getApiErrorMessage } from '@client-manager/shared';
import { useForm } from 'react-hook-form';
import { tenantsApi } from '../api/admin.api';
import { showToast } from '../../../shared/utils/toast';
import { resolveTenantLoginUrl } from '../../../shared/utils/app-url';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { Modal } from '../../../shared/ui/modals/Modal';
import { formInputClass, formLabelClass } from '../../../shared/ui/forms/form-styles';
import { Key, Copy, CheckCircle } from 'lucide-react';

interface ResetPasswordModalProps {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  userId,
  userName,
  userEmail,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = React.useState<'form' | 'success'>('form');
  const [savedPassword, setSavedPassword] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      password: 'Mudar' + Math.floor(1000 + Math.random() * 9000) + '!',
    },
  });

  const onSubmit = async (data: { password: string }) => {
    if (!userEmail) return;

    try {
      await tenantsApi.resetPassword(userEmail, data.password);
      setSavedPassword(data.password);
      setStep('success');
      onSuccess();
    } catch (err: unknown) {
      showToast.error(getApiErrorMessage(err, 'Erro ao resetar senha'));
    }
  };

  const handleCopy = () => {
    const loginUrl = resolveTenantLoginUrl();
    const text = `Olá ${userName}, sua senha no ${APP_NAME} foi resetada.\n\nAcesso: ${loginUrl}\nE-mail: ${userEmail}\nSenha Provisória: ${savedPassword}\n\n(Você deverá alterar esta senha no primeiro acesso).`;
    navigator.clipboard.writeText(text);
    showToast.success('Instruções copiadas!');
  };

  const handleClose = () => {
    setStep('form');
    setSavedPassword('');
    onClose();
  };

  if (step === 'success') {
    return (
      <Modal isOpen={!!userId} onClose={handleClose} title="Senha resetada">
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Sucesso!</h3>
            <p className="mt-1 text-sm text-slate-600">
              A senha de <strong>{userName}</strong> ({userEmail}) foi alterada.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Senha provisória
            </p>
            <div className="flex items-center justify-between">
              <code className="font-mono text-lg font-bold text-form-primary">{savedPassword}</code>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md p-2 text-slate-400 transition-all hover:bg-form-primary/5 hover:text-form-primary"
                title="Copiar senha"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-slate-900 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Copy className="h-4 w-4" />
            <span>Copiar instruções de acesso</span>
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <FormModal
      isOpen={!!userId}
      onClose={handleClose}
      title="Resetar senha"
      saveLabel="Confirmar reset"
      pendingLabel="Processando..."
      isPending={isSubmitting}
      onSave={() => formRef.current?.requestSubmit()}
    >
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-slate-600">
          Defina uma senha provisória para <strong>{userName}</strong>. Ele será obrigado a trocá-la
          no primeiro acesso.
        </p>

        <label className="block">
          <span className={formLabelClass}>Senha provisória</span>
          <div className="relative">
            <input
              {...register('password', { required: true, minLength: 6 })}
              className={`${formInputClass} pr-10`}
            />
            <Key className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
          </div>
        </label>
      </form>
    </FormModal>
  );
};

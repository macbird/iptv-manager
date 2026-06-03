import React from 'react';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import {
  formLabelClass,
  formSelectClass,
  formTextareaClass,
} from '../../../shared/ui/forms/form-styles';
import {
  CONNECTION_RENEWAL_STATUS_LABELS,
  type ActivationListItem,
  type ActivationStatusInputValue,
  type ConnectionRenewalStatusValue,
} from '@client-manager/shared';

function allowedTargets(current: ConnectionRenewalStatusValue): ActivationStatusInputValue[] {
  if (current === 'pending') {
    return ['completed', 'cancelled'];
  }
  if (current === 'cancelled') {
    return ['pending'];
  }
  return [];
}

interface ActivationStatusModalProps {
  activation: ActivationListItem | null;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (status: ActivationStatusInputValue, notes?: string) => void;
}

export const ActivationStatusModal: React.FC<ActivationStatusModalProps> = ({
  activation,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}) => {
  const [status, setStatus] = React.useState<ActivationStatusInputValue>('pending');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (!activation || !isOpen) return;
    const targets = allowedTargets(activation.status);
    setStatus(targets[0] ?? activation.status);
    setNotes(activation.notes ?? '');
  }, [activation, isOpen]);

  if (!activation) return null;

  const targets = allowedTargets(activation.status);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Alterar status"
      size="md"
      isPending={isPending}
      saveLabel="Salvar status"
      saveDisabled={targets.length === 0}
      onSave={() => onSubmit(status, notes.trim() || undefined)}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          {activation.customer.name} ·{' '}
          {activation.connectionCount === 1
            ? '1 conexão'
            : `${activation.connectionCount} conexões`}
        </p>

        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
          Status atual: <strong>{CONNECTION_RENEWAL_STATUS_LABELS[activation.status]}</strong>
        </div>

        {targets.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ativações concluídas não podem ter o status alterado.
          </p>
        ) : (
          <>
            <label className="block">
              <span className={formLabelClass}>Novo status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ActivationStatusInputValue)}
                className={formSelectClass}
              >
                {targets.map((value) => (
                  <option key={value} value={value}>
                    {CONNECTION_RENEWAL_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={formLabelClass}>Observações (opcional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                className={formTextareaClass}
                placeholder="Ex.: cliente pediu para adiar"
              />
            </label>
          </>
        )}
      </div>
    </FormModal>
  );
};

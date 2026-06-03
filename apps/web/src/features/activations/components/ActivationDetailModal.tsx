import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../../shared/ui/modals/Modal';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { CopyableField } from '../../../shared/ui/forms/CopyableField';
import { activationsApi } from '../api/activations.api';
import {
  CONNECTION_RENEWAL_STATUS_LABELS,
  getConnectionRenewalStatusBadgeClass,
} from '@client-manager/shared';
import { formatCents } from '../../../shared/ui/billing/format-billing';
import {
  formCancelButtonClass,
  formSubmitButtonClass,
  formTextareaClass,
  formLabelClass,
} from '../../../shared/ui/forms/form-styles';

interface ActivationDetailModalProps {
  activationId: string | null;
  isOpen: boolean;
  isCompleting: boolean;
  onClose: () => void;
  onComplete: (notes?: string) => void;
}

export const ActivationDetailModal: React.FC<ActivationDetailModalProps> = ({
  activationId,
  isOpen,
  isCompleting,
  onClose,
  onComplete,
}) => {
  const [notes, setNotes] = React.useState('');

  const { data: activation, isLoading, isError } = useQuery({
    queryKey: ['activations', activationId, 'detail'],
    queryFn: () => activationsApi.getById(activationId!),
    enabled: isOpen && Boolean(activationId),
  });

  React.useEffect(() => {
    if (isOpen) {
      setNotes('');
    }
  }, [isOpen, activationId]);

  const footer = activation?.status === 'pending' ? (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className={formCancelButtonClass} disabled={isCompleting}>
        Fechar
      </button>
      <button
        type="button"
        onClick={() => onComplete(notes.trim() || undefined)}
        disabled={isCompleting}
        className={formSubmitButtonClass}
      >
        {isCompleting ? 'Concluindo...' : 'Concluir ativação'}
      </button>
    </div>
  ) : (
    <div className="flex justify-end">
      <button type="button" onClick={onClose} className={formCancelButtonClass}>
        Fechar
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ativação do cliente"
      size="2xl"
      footer={!isLoading && !isError && activation ? footer : undefined}
    >
      {isLoading ? (
        <div className="relative h-40">
          <LoadingSpinner />
        </div>
      ) : isError || !activation ? (
        <p className="text-sm text-red-600">Não foi possível carregar a ativação.</p>
      ) : (
        <div className="space-y-5 max-h-[min(70vh,640px)] overflow-y-auto pr-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{activation.customer.name}</h3>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getConnectionRenewalStatusBadgeClass(activation.status)}`}
            >
              {CONNECTION_RENEWAL_STATUS_LABELS[activation.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <CopyableField
              label="Valor pago"
              value={formatCents(activation.payment.amountCents)}
            />
            <CopyableField
              label="Pago em"
              value={new Date(activation.payment.paidAt).toLocaleDateString('pt-BR')}
            />
            <CopyableField
              label="Vencimento atual"
              value={
                activation.customer.expiresAt
                  ? new Date(activation.customer.expiresAt).toLocaleDateString('pt-BR')
                  : '—'
              }
            />
            <CopyableField
              label="Conexões"
              value={String(activation.connectionCount)}
            />
          </div>

          {activation.status === 'pending' ? (
            <label className="block">
              <span className={formLabelClass}>Observações (opcional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                className={formTextareaClass}
                placeholder="Anotações ao concluir a ativação"
              />
            </label>
          ) : null}

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Conexões ({activation.connections.length})
            </h4>
            {activation.connections.map((connection, index) => (
              <div
                key={connection.id}
                className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs font-semibold text-indigo-700">
                  Conexão {index + 1}
                  {connection.label ? ` · ${connection.label}` : ''}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <CopyableField label="Servidor" value={connection.server.name} />
                  <CopyableField label="Aplicativo" value={connection.applicationName} />
                  <CopyableField label="MAC" value={connection.macAddress} mono />
                  <CopyableField label="Rótulo" value={connection.label} />
                  <CopyableField
                    label="URL do painel"
                    value={connection.server.panelUrl}
                    mono
                  />
                  <CopyableField label="Usuário do painel" value={connection.server.panelUsername} />
                  <CopyableField
                    label="Senha do painel"
                    value={connection.server.panelPassword}
                    masked
                  />
                  <CopyableField label="M3U8 Link" value={connection.m3u8Link} mono />
                </div>
                {connection.server.panelNotes ? (
                  <CopyableField label="Notas do servidor" value={connection.server.panelNotes} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

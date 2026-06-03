import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serversApi } from '../api/servers.api';
import { ServerForm } from '../pages/ServerForm';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { showToast } from '../../../shared/utils/toast';
import type { ServerFormPayload } from '../pages/ServerForm';

interface ServerFormModalProps {
  isOpen: boolean;
  editId: string | null;
  onClose: () => void;
}

export const ServerFormModal: React.FC<ServerFormModalProps> = ({ isOpen, editId, onClose }) => {
  const queryClient = useQueryClient();
  const formId = editId ? `server-form-edit-${editId}` : 'server-form-create';

  const {
    data: server,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['servers', editId],
    queryFn: () => serversApi.getById(editId!),
    enabled: isOpen && Boolean(editId),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: serversApi.create,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      if (created?.id) {
        queryClient.setQueryData(['servers', created.id], created);
      }
      showToast.success('Servidor criado com sucesso!');
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast.error(err.response?.data?.message ?? 'Erro ao criar servidor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; data: ServerFormPayload }) =>
      serversApi.update(args.id, args.data),
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.setQueryData(['servers', variables.id], updated);
      showToast.success('Servidor atualizado com sucesso!');
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast.error(err.response?.data?.message ?? 'Erro ao atualizar servidor');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Editar servidor' : 'Novo servidor'}
      size="lg"
      formId={!editId || server ? formId : undefined}
      isPending={isPending}
      saveLabel={editId ? 'Salvar' : 'Criar'}
    >
      {!editId ? (
        <ServerForm
          key="create"
          formId={formId}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          onCancel={onClose}
        />
      ) : isLoading ? (
        <div className="relative h-32">
          <LoadingSpinner />
        </div>
      ) : isError || !server ? (
        <p className="text-sm text-red-600">Não foi possível carregar os dados do servidor.</p>
      ) : (
        <ServerForm
          key={`${editId}-${server.updatedAt}`}
          formId={formId}
          initialData={server}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({ id: editId, data });
          }}
          onCancel={onClose}
        />
      )}
    </FormModal>
  );
};

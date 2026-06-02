import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { serversApi } from '../api/servers.api';
import { ServerForm } from '../pages/ServerForm';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { ServerInput } from '@client-manager/shared';

interface ServerFormModalProps {
  isOpen: boolean;
  editId: string | null;
  onClose: () => void;
}

export const ServerFormModal: React.FC<ServerFormModalProps> = ({ isOpen, editId, onClose }) => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const { data: server, isLoading } = useQuery({
    queryKey: ['servers', editId],
    queryFn: () => serversApi.getById(editId!),
    enabled: isOpen && Boolean(editId),
  });

  const { create, update, isCreating, isUpdating } = useCrud<unknown, ServerInput>({
    queryKey: ['servers'],
    createFn: serversApi.create,
    updateFn: serversApi.update,
    listPath: '/servers',
    entityName: 'Servidor',
    navigateOnSuccess: false,
    onSuccess: onClose,
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Editar servidor' : 'Novo servidor'}
      size="lg"
      isPending={isCreating || isUpdating}
      onSave={() => formRef.current?.requestSubmit()}
    >
      {editId && isLoading ? (
        <div className="relative h-32">
          <LoadingSpinner />
        </div>
      ) : (
        <ServerForm
          key={editId ?? 'create'}
          ref={formRef}
          initialData={editId ? server : undefined}
          onSubmit={async (data) => {
            if (editId) {
              await update(editId, data);
              return;
            }
            await create(data);
          }}
          onCancel={onClose}
        />
      )}
    </FormModal>
  );
};

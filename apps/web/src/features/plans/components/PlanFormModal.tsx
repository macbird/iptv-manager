import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { plansApi } from '../api/plans.api';
import { PlanForm } from '../pages/PlanForm';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { PlanInput } from '@client-manager/shared';

interface PlanFormModalProps {
  isOpen: boolean;
  editId: string | null;
  onClose: () => void;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({ isOpen, editId, onClose }) => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plans', editId],
    queryFn: () => plansApi.getById(editId!),
    enabled: isOpen && Boolean(editId),
  });

  const { create, update, isCreating, isUpdating } = useCrud<unknown, PlanInput>({
    queryKey: ['plans'],
    createFn: plansApi.create,
    updateFn: plansApi.update,
    listPath: '/plans',
    entityName: 'Plano',
    navigateOnSuccess: false,
    onSuccess: onClose,
  });

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Editar plano' : 'Novo plano'}
      size="lg"
      isPending={isCreating || isUpdating}
      onSave={() => formRef.current?.requestSubmit()}
    >
      {editId && isLoading ? (
        <div className="relative h-32">
          <LoadingSpinner />
        </div>
      ) : (
        <PlanForm
          key={editId ?? 'create'}
          ref={formRef}
          initialData={editId ? plan : undefined}
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

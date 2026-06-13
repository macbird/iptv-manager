import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformPlansApi } from '../api/platform-plans.api';
import { PlatformPlanForm } from '../pages/PlatformPlanForm';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { getApiErrorMessage, type PlatformPlanInput } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';

interface PlatformPlanFormModalProps {
  isOpen: boolean;
  editId: string | null;
  onClose: () => void;
}

export const PlatformPlanFormModal: React.FC<PlatformPlanFormModalProps> = ({
  isOpen,
  editId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const formId = editId ? `platform-plan-form-edit-${editId}` : 'platform-plan-form-create';

  const { data: plan, isLoading } = useQuery({
    queryKey: ['platform-plans', editId],
    queryFn: () => platformPlansApi.getById(editId!),
    enabled: isOpen && Boolean(editId),
  });

  const createMutation = useMutation({
    mutationFn: platformPlansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
      showToast.success('Plano criado com sucesso!');
      onClose();
    },
    onError: (err: unknown) => {
      showToast.error(getApiErrorMessage(err, 'Erro ao criar plano'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; data: PlatformPlanInput }) =>
      platformPlansApi.update(args.id, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
      showToast.success('Plano atualizado com sucesso!');
      onClose();
    },
    onError: (err: unknown) => {
      showToast.error(getApiErrorMessage(err, 'Erro ao atualizar plano'));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Editar plano' : 'Novo plano'}
      size="lg"
      formId={!editId || plan ? formId : undefined}
      isPending={isPending}
      saveLabel={editId ? 'Salvar' : 'Criar'}
    >
      {!editId ? (
        <PlatformPlanForm
          key="create"
          formId={formId}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
        />
      ) : isLoading || !plan ? (
        <div className="relative h-32">
          <LoadingSpinner />
        </div>
      ) : (
        <PlatformPlanForm
          key={editId}
          formId={formId}
          initialData={plan}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({ id: editId, data });
          }}
        />
      )}
    </FormModal>
  );
};

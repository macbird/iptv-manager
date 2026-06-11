import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import { CustomerForm, type CustomerFormPayload } from '../pages/CustomerForm';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { getApiErrorMessage } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';

interface CustomerFormModalProps {
  isOpen: boolean;
  editId: string | null;
  onClose: () => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  editId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const formId = editId ? `customer-form-edit-${editId}` : 'customer-form-create';

  const {
    data: customer,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customers', editId],
    queryFn: () => customersApi.getById(editId!),
    enabled: isOpen && Boolean(editId),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast.success('Cliente criado com sucesso!');
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast.error(getApiErrorMessage(err, 'Erro ao criar cliente'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; data: CustomerFormPayload }) =>
      customersApi.update(args.id, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast.success('Cliente atualizado com sucesso!');
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast.error(getApiErrorMessage(err, 'Erro ao atualizar cliente'));
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Editar cliente' : 'Novo cliente'}
      size="3xl"
      formId={!editId || customer ? formId : undefined}
      isPending={isPending}
      saveLabel={editId ? 'Salvar' : 'Criar'}
    >
      {!editId ? (
        <CustomerForm
          key="create"
          formId={formId}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          onCancel={onClose}
        />
      ) : isLoading ? (
        <div className="relative h-40">
          <LoadingSpinner />
        </div>
      ) : isError || !customer ? (
        <p className="text-sm text-red-600">Não foi possível carregar os dados do cliente.</p>
      ) : (
        <CustomerForm
          key={`${editId}-${customer.updatedAt}`}
          formId={formId}
          initialData={customer}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({ id: editId, data });
          }}
          onCancel={onClose}
        />
      )}
    </FormModal>
  );
};

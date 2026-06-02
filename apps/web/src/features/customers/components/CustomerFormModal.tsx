import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import { CustomerForm } from '../pages/CustomerForm';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { CustomerInput } from '@client-manager/shared';

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
  const formRef = React.useRef<HTMLFormElement>(null);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customers', editId],
    queryFn: () => customersApi.getById(editId!),
    enabled: isOpen && Boolean(editId),
  });

  const { create, update, isCreating, isUpdating } = useCrud<unknown, CustomerInput>({
    queryKey: ['customers'],
    createFn: customersApi.create,
    updateFn: customersApi.update,
    listPath: '/customers',
    entityName: 'Cliente',
    navigateOnSuccess: false,
    onSuccess: onClose,
  });

  const isPending = isCreating || isUpdating;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Editar cliente' : 'Novo cliente'}
      size="2xl"
      isPending={isPending}
      onSave={() => formRef.current?.requestSubmit()}
    >
      {editId && isLoading ? (
        <div className="relative h-40">
          <LoadingSpinner />
        </div>
      ) : (
        <CustomerForm
          key={editId ?? 'create'}
          ref={formRef}
          initialData={editId ? customer : undefined}
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

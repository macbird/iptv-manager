import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '../api/admin.api';
import { AccountForm, type AccountCreateInput, type AccountEditInput } from '../pages/AccountForm';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { useCrud } from '../../../shared/hooks/useCrud';

interface AccountFormModalProps {
  isOpen: boolean;
  editId: string | null;
  onClose: () => void;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  editId,
  onClose,
}) => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const { data: account, isLoading } = useQuery({
    queryKey: ['accounts', editId],
    queryFn: () => tenantsApi.getById(editId!),
    enabled: isOpen && Boolean(editId),
  });

  const { create, update, isCreating, isUpdating } = useCrud<
    unknown,
    AccountCreateInput | AccountEditInput
  >({
    queryKey: ['accounts'],
    createFn: tenantsApi.create,
    updateFn: (accountId, data) =>
      tenantsApi.toggleStatus(accountId, (data as AccountEditInput).status),
    listPath: '/admin/accounts',
    entityName: 'Conta',
    navigateOnSuccess: false,
    onSuccess: onClose,
  });

  const isPending = isCreating || isUpdating;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Editar conta' : 'Nova conta'}
      size="xl"
      isPending={isPending}
      saveLabel={editId ? 'Salvar' : 'Criar'}
      onSave={() => formRef.current?.requestSubmit()}
    >
      {editId && isLoading ? (
        <div className="relative h-32">
          <LoadingSpinner />
        </div>
      ) : editId && account ? (
        <AccountForm
          key={editId ?? 'create'}
          ref={formRef}
          mode="edit"
          initialData={account}
          onSubmit={async (data) => {
            await update(editId, data as AccountEditInput);
          }}
        />
      ) : (
        <AccountForm
          key="create"
          ref={formRef}
          mode="create"
          onSubmit={async (data) => {
            await create(data as AccountCreateInput);
          }}
        />
      )}
    </FormModal>
  );
};

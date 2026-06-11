import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '@client-manager/shared';
import { showToast } from '../utils/toast';

interface CrudOptions<TData, TInput> {
  queryKey: string[];
  createFn?: (data: TInput) => Promise<TData>;
  updateFn?: (id: string, data: TInput) => Promise<TData>;
  deleteFn?: (id: string) => Promise<void>;
  listPath: string;
  entityName: string;
  navigateOnSuccess?: boolean;
  onSuccess?: () => void;
}

export function useCrud<TData, TInput>({
  queryKey,
  createFn,
  updateFn,
  deleteFn,
  listPath,
  entityName,
  navigateOnSuccess = true,
  onSuccess,
}: CrudOptions<TData, TInput>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createFn!,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showToast.success(`${entityName} criado com sucesso!`);
      onSuccess?.();
      if (navigateOnSuccess) {
        navigate(listPath);
      }
    },
    onError: (err: unknown) =>
      showToast.error(getApiErrorMessage(err, `Erro ao criar ${entityName.toLowerCase()}`)),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; data: TInput }) => updateFn!(args.id, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showToast.success(`${entityName} atualizado com sucesso!`);
      onSuccess?.();
      if (navigateOnSuccess) {
        navigate(listPath);
      }
    },
    onError: (err: unknown) =>
      showToast.error(getApiErrorMessage(err, `Erro ao atualizar ${entityName.toLowerCase()}`)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn!,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showToast.success(`${entityName} excluído com sucesso!`);
    },
    onError: (err: unknown) =>
      showToast.error(getApiErrorMessage(err, `Erro ao excluir ${entityName.toLowerCase()}`)),
  });

  return {
    create: createMutation.mutateAsync,
    update: (id: string, data: TInput) => updateMutation.mutateAsync({ id, data }),
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

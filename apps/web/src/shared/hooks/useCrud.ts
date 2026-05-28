import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';

interface CrudOptions<TData, TInput> {
  queryKey: string[];
  createFn?: (data: TInput) => Promise<TData>;
  updateFn?: (id: string, data: TInput) => Promise<TData>;
  deleteFn?: (id: string) => Promise<void>;
  listPath: string;
  entityName: string;
}

export function useCrud<TData, TInput>({
  queryKey,
  createFn,
  updateFn,
  deleteFn,
  listPath,
  entityName,
}: CrudOptions<TData, TInput>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createFn!,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showToast.success(`${entityName} criado com sucesso!`);
      navigate(listPath);
    },
    onError: (err: any) => showToast.error(err.response?.data?.message || `Erro ao criar ${entityName.toLowerCase()}`),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; data: TInput }) => updateFn!(args.id, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showToast.success(`${entityName} atualizado com sucesso!`);
      navigate(listPath);
    },
    onError: (err: any) => showToast.error(err.response?.data?.message || `Erro ao atualizar ${entityName.toLowerCase()}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn!,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showToast.success(`${entityName} excluído com sucesso!`);
    },
    onError: (err: any) => showToast.error(err.response?.data?.message || `Erro ao excluir ${entityName.toLowerCase()}`),
  });

  return {
    create: createMutation.mutateAsync,
    update: (id: string, data: TInput) => updateMutation.mutateAsync({ id, data }),
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

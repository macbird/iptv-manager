import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@client-manager/shared';
import { authApi } from '../api/auth.api';
import { primaryButtonClass, secondaryButtonClass } from '../../../shared/ui/buttons/button-styles';
import { showToast } from '../../../shared/utils/toast';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { UserProfileForm } from './UserProfileForm';

export const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = React.useRef<HTMLFormElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
  });

  const updateMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      showToast.success('Perfil atualizado com sucesso!');
    },
    onError: (err: unknown) => {
      showToast.error(getApiErrorMessage(err, 'Erro ao atualizar perfil'));
    },
  });

  if (isLoading) {
    return (
      <div className="relative h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageLayout
      title="Meu Perfil"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className={secondaryButtonClass}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={() => formRef.current?.requestSubmit()}
            className={primaryButtonClass}
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      }
    >
      <UserProfileForm
        ref={formRef}
        initialData={profile}
        onSubmit={async (data) => {
          await updateMutation.mutateAsync(data);
        }}
      />
    </PageLayout>
  );
};

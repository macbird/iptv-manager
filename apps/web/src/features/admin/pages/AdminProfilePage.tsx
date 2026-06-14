import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@client-manager/shared';
import { adminAuthApi } from '../api/admin.api';
import { primaryButtonClass, secondaryButtonClass } from '../../../shared/ui/buttons/button-styles';
import { showToast } from '../../../shared/utils/toast';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { AdminProfileForm } from './AdminProfileForm';

export const AdminProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = React.useRef<HTMLFormElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-me'],
    queryFn: adminAuthApi.getProfile,
  });

  const updateMutation = useMutation({
    mutationFn: adminAuthApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-me'] });
      showToast.success('Perfil administrativo atualizado!');
    },
    onError: (err: unknown) => {
      showToast.error(getApiErrorMessage(err, 'Erro ao atualizar perfil admin'));
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
            onClick={() => navigate('/admin/dashboard')}
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
      <AdminProfileForm
        ref={formRef}
        initialData={profile}
        onSubmit={async (data) => {
          await updateMutation.mutateAsync(data);
        }}
      />
    </PageLayout>
  );
};

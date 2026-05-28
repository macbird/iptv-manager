import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '../api/tags.api';
import { TagForm } from './TagForm';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { TagInput } from '@iptv-manager/shared';

export const EditTagPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: tag, isLoading } = useQuery({
    queryKey: ['tags', id],
    queryFn: () => tagsApi.list().then(tags => tags.find((t: any) => t.id === id)),
  });

  const { update } = useCrud<any, TagInput>({
    queryKey: ['tags'],
    updateFn: tagsApi.update,
    listPath: '/tags',
    entityName: 'Tag',
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <FormLayout title="Editar Tag">
      <TagForm 
        initialData={tag}
        onSubmit={async (data) => await update(id!, data)} 
        onCancel={() => navigate('/tags')} 
      />
    </FormLayout>
  );
};

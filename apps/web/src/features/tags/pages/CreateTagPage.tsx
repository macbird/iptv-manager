import React from 'react';
import { useNavigate } from 'react-router-dom';
import { tagsApi } from '../api/tags.api';
import { TagForm } from './TagForm';
import { FormLayout } from '../../../shared/ui/forms/FormLayout';
import { useCrud } from '../../../shared/hooks/useCrud';
import type { TagInput } from '@iptv-manager/shared';

export const CreateTagPage: React.FC = () => {
  const navigate = useNavigate();
  const { create } = useCrud<any, TagInput>({
    queryKey: ['tags'],
    createFn: tagsApi.create,
    listPath: '/tags',
    entityName: 'Tag',
  });

  return (
    <FormLayout title="Nova Tag">
      <TagForm 
        onSubmit={async (data) => await create(data)} 
        onCancel={() => navigate('/tags')} 
      />
    </FormLayout>
  );
};

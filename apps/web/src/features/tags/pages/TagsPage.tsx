import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '../api/tags.api';
import { CardList, EntityCard } from '../../../shared/ui/lists/EntityCard';
import { Plus, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomSheet } from '../../../shared/ui/modals/BottomSheet';
import { useCrud } from '../../../shared/hooks/useCrud';

export const TagsPage: React.FC = () => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.list,
  });

  const { remove } = useCrud({
    queryKey: ['tags'],
    deleteFn: tagsApi.delete,
    listPath: '/tags',
    entityName: 'Tag',
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tags</h1>
        <Link 
          to="/tags/new"
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nova Tag
        </Link>
      </div>

      <CardList>
        {tags?.map((tag: any) => (
          <EntityCard
            key={tag.id}
            icon={<Tag className="h-5 w-5" />}
            title={tag.name}
            footer={
              <div className="flex items-center text-sm font-medium text-slate-600">
                <div 
                  className="w-4 h-4 rounded-full mr-2 shadow-inner" 
                  style={{ backgroundColor: tag.color || '#ccc' }}
                ></div>
                {tag.color || 'Sem cor'}
              </div>
            }
            onEdit={() => navigate(`/tags/${tag.id}/edit`)}
            onDelete={() => setDeleteId(tag.id)}
          />
        ))}
      </CardList>
      
      {tags?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Nenhuma tag cadastrada.</p>
        </div>
      )}

      <BottomSheet 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        title="Excluir Tag"
        description="Tem certeza que deseja excluir esta tag? Esta ação não poderá ser desfeita."
      />
    </div>
  );
};

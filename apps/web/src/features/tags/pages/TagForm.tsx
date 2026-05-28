import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tagSchema, type TagInput } from '@iptv-manager/shared';

interface TagFormProps {
  onSubmit: (data: TagInput) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<TagInput>;
}

export const TagForm: React.FC<TagFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
    defaultValues: { color: '#4F46E5' },
  });

  const color = watch('color');

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <input
          {...register('name')}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Cor (Hex)</label>
        <div className="flex items-center mt-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setValue('color', e.target.value)}
            className="h-10 w-10 border border-gray-300 rounded-md mr-2"
          />
          <input
            type="text"
            {...register('color')}
            placeholder="#000000"
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>}
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

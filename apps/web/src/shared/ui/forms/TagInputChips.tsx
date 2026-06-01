import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { tagsApi, type TagDto } from '../../../features/tags/api/tags.api';

export type TagScope = 'customer' | 'server';

interface TagInputChipsProps {
  value: TagDto[];
  onChange: (tags: TagDto[]) => void;
  scope: TagScope;
  disabled?: boolean;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export const TagInputChips: React.FC<TagInputChipsProps> = ({
  value,
  onChange,
  scope,
  disabled = false,
}) => {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const debouncedQuery = useDebouncedValue(inputValue.trim(), 300);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ['tags', 'search', scope, debouncedQuery],
    queryFn: () => tagsApi.search(debouncedQuery),
    enabled: isOpen && debouncedQuery.length > 0,
  });

  const addTag = (tag: TagDto) => {
    if (!value.find((t) => t.id === tag.id)) {
      onChange([...value, tag]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const removeTag = (tagId: string) => {
    onChange(value.filter((t) => t.id !== tagId));
  };

  const filteredSuggestions = suggestions.filter(
    (t) => !value.find((v) => v.id === t.id),
  );

  const normalizedInput = inputValue.trim().toLowerCase();
  const hasExactMatch =
    normalizedInput.length > 0 &&
    (value.some((t) => t.name.toLowerCase() === normalizedInput) ||
      filteredSuggestions.some((t) => t.name.toLowerCase() === normalizedInput));

  const showCreateOption = normalizedInput.length > 0 && !hasExactMatch;

  const resolveAndAdd = async () => {
    const name = inputValue.trim();
    if (!name || disabled || isCreating) return;

    const existing =
      value.find((t) => t.name.toLowerCase() === name.toLowerCase()) ??
      filteredSuggestions.find((t) => t.name.toLowerCase() === name.toLowerCase());

    if (existing) {
      addTag(existing);
      return;
    }

    setIsCreating(true);
    try {
      const created = await tagsApi.findOrCreate(name);
      await queryClient.invalidateQueries({ queryKey: ['tags'] });
      addTag(created);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      await resolveAndAdd();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {value.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium"
          >
            {tag.name}
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeTag(tag.id)}
              className="hover:text-indigo-900 disabled:opacity-50"
              aria-label={`Remover tag ${tag.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          disabled={disabled || isCreating}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={isCreating ? 'Salvando tag...' : 'Digite para buscar ou criar tag...'}
          className="w-full p-2 border border-slate-300 rounded-md text-sm disabled:bg-slate-50"
        />

        {isOpen && (debouncedQuery.length > 0 || showCreateOption) && (
          <div className="absolute z-20 w-full bg-white border border-slate-200 mt-1 rounded-md shadow-lg max-h-48 overflow-auto">
            {isFetching && (
              <p className="px-3 py-2 text-xs text-slate-500">Buscando...</p>
            )}

            {filteredSuggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(tag)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              >
                {tag.name}
              </button>
            ))}

            {showCreateOption && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void resolveAndAdd()}
                className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 border-t border-slate-100"
              >
                Criar tag &quot;{inputValue.trim()}&quot;
              </button>
            )}

            {!isFetching && filteredSuggestions.length === 0 && !showCreateOption && (
              <p className="px-3 py-2 text-xs text-slate-500">Nenhuma tag encontrada</p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Enter ou vírgula para adicionar. Tags inexistentes são criadas automaticamente.
      </p>
    </div>
  );
};

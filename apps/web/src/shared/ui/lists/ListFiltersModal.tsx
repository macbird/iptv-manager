import React from 'react';
import { Modal } from '../modals/Modal';
import type { ListFilterValues } from '@client-manager/shared';

export type ListFilterFieldType = 'select' | 'date' | 'month' | 'number';

export interface ListFilterFieldDef {
  key: string;
  label: string;
  type: ListFilterFieldType;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface ListFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  fields: ListFilterFieldDef[];
  draft: ListFilterValues;
  onDraftChange: (values: ListFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
}

export const ListFiltersModal: React.FC<ListFiltersModalProps> = ({
  isOpen,
  onClose,
  title = 'Filtros',
  fields,
  draft,
  onDraftChange,
  onApply,
  onClear,
}) => {
  const setField = (key: string, value: string) => {
    onDraftChange({ ...draft, [key]: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-xs font-medium text-slate-500">{field.label}</span>
            {field.type === 'select' ? (
              <select
                value={draft[field.key] ?? ''}
                onChange={(e) => setField(field.key, e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Todos</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === 'number' ? 'text' : field.type}
                inputMode={field.type === 'number' ? 'decimal' : undefined}
                placeholder={field.placeholder}
                value={draft[field.key] ?? ''}
                onChange={(e) => setField(field.key, e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            )}
          </label>
        ))}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClear}
            className="flex-1 rounded-md border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-md bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Aplicar
          </button>
        </div>
      </div>
    </Modal>
  );
};

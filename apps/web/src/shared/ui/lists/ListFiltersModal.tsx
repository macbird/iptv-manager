import React from 'react';
import { Modal } from '../modals/Modal';
import type { ListFilterValues } from '@client-manager/shared';
import { primaryButtonModalClass, secondaryButtonModalClass } from '../buttons/button-styles';
import { filterActionsRowClass, filterFieldClass } from '../brand/brand-styles';

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
                className={filterFieldClass}
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
                className={filterFieldClass}
              />
            )}
          </label>
        ))}

        <div className={filterActionsRowClass}>
          <button type="button" onClick={onClear} className={secondaryButtonModalClass}>
            Limpar
          </button>
          <button type="button" onClick={onApply} className={primaryButtonModalClass}>
            Aplicar
          </button>
        </div>
      </div>
    </Modal>
  );
};

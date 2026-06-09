import React from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FormField } from './FormField';
import {
  formIconSizeClass,
  formIconSuffixClass,
  formInputClass,
  formInputPaddingClass,
} from './form-styles';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export interface AsyncSearchSelectOption {
  value: string;
  label: string;
  hint?: string;
  meta?: Record<string, unknown>;
}

export interface AsyncSearchSelectProps {
  label: string;
  value: string;
  selectedLabel?: string;
  onChange: (value: string, option?: AsyncSearchSelectOption) => void;
  onSearch: (query: string) => Promise<AsyncSearchSelectOption[]>;
  placeholder?: string;
  prefixIcon?: LucideIcon;
  disabled?: boolean;
  error?: string;
  hint?: string;
  emptyMessage?: string;
  debounceMs?: number;
}

export const AsyncSearchSelect: React.FC<AsyncSearchSelectProps> = ({
  label,
  value,
  selectedLabel,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  prefixIcon,
  disabled = false,
  error,
  hint,
  emptyMessage = 'Nenhum resultado encontrado',
  debounceMs = 300,
}) => {
  const inputId = React.useId();
  const listboxId = `${inputId}-listbox`;
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [options, setOptions] = React.useState<AsyncSearchSelectOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const displayValue = open ? query : selectedLabel ?? '';

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoading(true);

    void onSearch(debouncedQuery)
      .then((results) => {
        if (!cancelled) {
          setOptions(results);
          setActiveIndex(results.length > 0 ? 0 : -1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
          setActiveIndex(-1);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, onSearch, open]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selectOption = (option: AsyncSearchSelectOption) => {
    onChange(option.value, option);
    setOpen(false);
    setQuery('');
  };

  const clearSelection = () => {
    onChange('', undefined);
    setQuery('');
    setOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }

    if (!open) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, options.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
      event.preventDefault();
      selectOption(options[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const padding = formInputPaddingClass({
    hasPrefix: Boolean(prefixIcon),
    hasSuffix: true,
  });

  return (
    <FormField label={label} htmlFor={inputId} error={error} hint={hint} prefixIcon={prefixIcon}>
      <div ref={containerRef} className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          className={`${formInputClass} ${padding} pr-16 ${disabled ? '' : ''}`.trim()}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            if (!query && selectedLabel) {
              setQuery('');
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
            if (value) {
              onChange('', undefined);
            }
          }}
          onKeyDown={handleKeyDown}
        />

        <div className={`${formIconSuffixClass} flex items-center gap-1`}>
          {isLoading ? (
            <Loader2 className={`${formIconSizeClass} animate-spin text-slate-400`} aria-hidden />
          ) : value ? (
            <button
              type="button"
              onClick={clearSelection}
              className="rounded p-0.5 text-slate-400 hover:text-slate-600"
              aria-label="Limpar seleção"
            >
              <X className={formIconSizeClass} />
            </button>
          ) : (
            <ChevronDown className={formIconSizeClass} strokeWidth={1.75} aria-hidden />
          )}
        </div>

        {open && !disabled ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[10px] border border-slate-200 bg-white py-1 shadow-lg"
          >
            {isLoading ? (
              <li className="px-3 py-2 text-sm text-slate-500">Buscando...</li>
            ) : options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</li>
            ) : (
              options.map((option, index) => (
                <li key={option.value} role="option" aria-selected={value === option.value}>
                  <button
                    type="button"
                    className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                      index === activeIndex ? 'bg-indigo-50' : ''
                    } ${value === option.value ? 'font-medium text-indigo-700' : 'text-slate-900'}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="truncate text-xs text-slate-500">{option.hint}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </FormField>
  );
};

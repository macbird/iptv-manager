import React, { useState } from 'react';
import { Search, X, Plus, SlidersHorizontal } from 'lucide-react';
import { newButtonClass } from '../buttons/button-styles';
import { brandIconButtonClass } from '../brand/brand-styles';

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

interface PageHeaderActionsProps {
  onSearch: (filter: string) => void;
  currentFilter: string;
  placeholder?: string;
  primaryAction?: ActionButtonProps;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
  showSearch?: boolean;
}

export const PageHeaderActions: React.FC<PageHeaderActionsProps> = ({
  onSearch,
  currentFilter,
  placeholder = "Buscar...",
  primaryAction,
  onOpenFilters,
  activeFilterCount = 0,
  showSearch = true,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filter, setFilter] = useState(currentFilter);

  const handleSearchChange = (value: string) => {
    setFilter(value);
    onSearch(value);
  };

  const toggleSearch = () => {
    if (isSearchOpen) {
      handleSearchChange('');
    }
    setIsSearchOpen(!isSearchOpen);
  };

  const PrimaryIcon = primaryAction?.icon || Plus;

  return (
    <div className="flex items-center space-x-2">
      {showSearch ? (
        isSearchOpen ? (
        <div className="flex-1 sm:flex-none flex items-center border border-slate-300 rounded-md p-1 bg-white animate-in fade-in slide-in-from-right-2 duration-200">
          <input
            type="text"
            placeholder={placeholder}
            value={filter}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="p-1 text-sm outline-none w-full"
            autoFocus
          />
          <button 
            onClick={toggleSearch} 
            className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsSearchOpen(true)} 
          className={`p-2 ${brandIconButtonClass}`}
          title="Abrir busca"
        >
          <Search className="w-5 h-5" />
        </button>
      )
      ) : null}

      {onOpenFilters ? (
        <button
          type="button"
          onClick={onOpenFilters}
          className={`relative p-2 ${brandIconButtonClass}`}
          title="Filtros"
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFilterCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-form-primary px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          className={`${newButtonClass} whitespace-nowrap transition-all ${
            isSearchOpen && showSearch ? 'hidden sm:flex' : 'flex'
          } ${primaryAction.className || ''}`}
        >
          <PrimaryIcon className="w-4 h-4 mr-1" /> {primaryAction.label}
        </button>
      )}
    </div>
  );
};

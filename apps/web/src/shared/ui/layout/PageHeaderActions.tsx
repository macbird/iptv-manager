import React, { useState } from 'react';
import { Search, X, Plus } from 'lucide-react';

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
}

export const PageHeaderActions: React.FC<PageHeaderActionsProps> = ({
  onSearch,
  currentFilter,
  placeholder = "Buscar...",
  primaryAction
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
      {isSearchOpen ? (
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
          className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
          title="Abrir busca"
        >
          <Search className="w-5 h-5" />
        </button>
      )}

      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className={`bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm transition-all whitespace-nowrap ${
            isSearchOpen ? 'hidden sm:flex' : 'flex'
          } ${primaryAction.className || ''}`}
        >
          <PrimaryIcon className="w-4 h-4 mr-1" /> {primaryAction.label}
        </button>
      )}
    </div>
  );
};

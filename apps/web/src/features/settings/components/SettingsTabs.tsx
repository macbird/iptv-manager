import React from 'react';
import { useSearchParams } from 'react-router-dom';

export interface SettingsTabItem {
  id: string;
  label: string;
  /** Shorter label for narrow screens (segmented variant). */
  shortLabel?: string;
}

interface SettingsTabsProps {
  tabs: SettingsTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  /** Segmented = horizontal pill toggle (better on mobile). */
  variant?: 'default' | 'segmented';
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
}) => {
  if (variant === 'segmented') {
    return (
      <nav
        className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg bg-slate-100 p-1"
        aria-label="Sub-abas"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`min-w-0 rounded-md px-2 py-2.5 text-center text-xs font-semibold leading-tight transition-colors sm:px-3 sm:py-2 sm:text-sm ${
                active
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex gap-1 overflow-x-auto sm:flex-wrap sm:gap-2">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`shrink-0 rounded-t-md px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                active
                  ? 'border border-b-white border-slate-200 bg-white text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export function useSettingsTab(defaultTab: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? defaultTab;

  const setActiveTab = React.useCallback(
    (tabId: string) => {
      setSearchParams({ tab: tabId }, { replace: true });
    },
    [setSearchParams],
  );

  return { activeTab, setActiveTab };
}

/**
 * Sub-tab state for Configurações → Cobrança (inicial D-N vs pós-vencimento D+N).
 */
export function useChargeSettingsSubTab(defaultSubTab = 'inicial') {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubTab = searchParams.get('cobrancaSub') ?? defaultSubTab;

  const setActiveSubTab = React.useCallback(
    (subTabId: string) => {
      const tab = searchParams.get('tab') ?? 'cobranca';
      setSearchParams({ tab, cobrancaSub: subTabId }, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return { activeSubTab, setActiveSubTab };
};

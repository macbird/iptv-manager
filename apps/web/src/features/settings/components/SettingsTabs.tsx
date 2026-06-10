import React from 'react';
import { useSearchParams } from 'react-router-dom';

export interface SettingsTabItem {
  id: string;
  label: string;
}

interface SettingsTabsProps {
  tabs: SettingsTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-slate-200">
    <nav className="-mb-px flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
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

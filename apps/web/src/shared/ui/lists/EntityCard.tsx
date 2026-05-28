import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export const CardList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {children}
  </div>
);

export const EntityCard: React.FC<{ 
  title: string, 
  subtitle?: string, 
  footer?: React.ReactNode,
  status?: string,
  icon?: React.ReactNode,
  onEdit?: () => void,
  onDelete?: () => void
}> = ({ title, subtitle, footer, status, icon, onEdit, onDelete }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-indigo-600">{icon}</div>}
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <div className="flex space-x-1">
          {onEdit && (
            <button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dashed Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-dashed border-slate-300"></div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        {status && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {status}
          </span>
        )}
      </div>
    </div>
    {footer && (
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 rounded-b-xl text-slate-500">
        {footer}
      </div>
    )}
  </div>
);

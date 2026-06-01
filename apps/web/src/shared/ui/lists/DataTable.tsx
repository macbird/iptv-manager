import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filter: string) => void;
}

export function DataTable<T>({ 
  data, 
  columns, 
  totalCount, 
  page, 
  pageSize, 
  onPageChange, 
  onFilterChange 
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Filtrar..."
        onChange={(e) => onFilterChange(e.target.value)}
        className="w-full border border-slate-300 rounded-md p-2"
      />
      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="p-3 text-sm font-semibold text-slate-700">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {columns.map((col, j) => (
                  <td key={j} className="p-3 text-sm text-slate-600">{col.accessor(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">Página {page} de {totalPages}</span>
        <div className="flex space-x-2">
          <button 
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

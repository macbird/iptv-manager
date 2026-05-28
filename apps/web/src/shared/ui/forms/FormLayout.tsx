import React from 'react';

interface FormLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const FormLayout: React.FC<FormLayoutProps> = ({ title, children }) => (
  <div className="max-w-2xl mx-auto py-8 px-4 md:px-0">
    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">{title}</h1>
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-slate-200">
      {children}
    </div>
  </div>
);

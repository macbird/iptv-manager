import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PageLayoutProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ title, actions, children, footer, className = "" }) => {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalNode(document.getElementById('mobile-header-portal'));
  }, []);

  const headerContent = (
    <div className="flex justify-between items-center w-full">
      <h1 className="text-xl font-bold truncate pr-2">{title}</h1>
      <div className="flex shrink-0">{actions}</div>
    </div>
  );

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Mobile Portal for Top Bar */}
      {portalNode && createPortal(headerContent, portalNode)}

      {/* Header for Desktop */}
      {(title || actions) && (
        <header className="hidden md:block p-4 border-b bg-white flex-none">
          {headerContent}
        </header>
      )}

      {/* Main Content (Scrollable) */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4">
          {children}
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="border-t bg-white flex-none p-4">
          {footer}
        </footer>
      )}
    </div>
  );
};

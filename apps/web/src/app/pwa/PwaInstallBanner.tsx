import React from 'react';
import { APP_NAME } from '@client-manager/shared';
import { Download, X } from 'lucide-react';
import { usePwaInstall } from './usePwaInstall';
import { primaryButtonSmClass } from '../../shared/ui/buttons/button-styles';

const DISMISS_KEY = 'pwa-install-dismissed';

export const PwaInstallBanner: React.FC = () => {
  const { canInstall, install, isStandalone } = usePwaInstall();
  const [dismissed, setDismissed] = React.useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  );

  if (isStandalone || dismissed || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-form-primary/30 bg-white p-4 shadow-lg md:left-auto">
      <button
        type="button"
        className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-100"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, '1');
          setDismissed(true);
        }}
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-6 text-sm font-semibold text-slate-900">Instalar {APP_NAME}</p>
      <p className="mt-1 text-xs text-slate-600">
        Abra como app na tela inicial, sem barra do navegador.
      </p>
      <button
        type="button"
        onClick={() => void install()}
        className={`mt-3 gap-2 text-xs ${primaryButtonSmClass}`}
      >
        <Download className="h-4 w-4" />
        Instalar app
      </button>
    </div>
  );
};

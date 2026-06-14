import React from 'react';
import { Copy, Check } from 'lucide-react';
import { showToast } from '../../utils/toast';

interface CopyableFieldProps {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  masked?: boolean;
}

export const CopyableField: React.FC<CopyableFieldProps> = ({
  label,
  value,
  mono = false,
  masked = false,
}) => {
  const [visible, setVisible] = React.useState(!masked);
  const [copied, setCopied] = React.useState(false);
  const displayValue = value?.trim() ? value : '—';
  const canCopy = Boolean(value?.trim());

  const handleCopy = async () => {
    if (!canCopy) return;
    await navigator.clipboard.writeText(value!.trim());
    setCopied(true);
    showToast.success(`${label} copiado`);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p
            className={`mt-0.5 break-all text-sm text-slate-900 ${mono ? 'font-mono' : ''} ${
              masked && !visible ? 'tracking-widest' : ''
            }`}
          >
            {masked && !visible && canCopy ? '••••••••' : displayValue}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {masked && canCopy ? (
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              className="rounded-md px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100"
            >
              {visible ? 'Ocultar' : 'Ver'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!canCopy}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-form-primary/5 hover:text-form-primary disabled:opacity-40"
            title={`Copiar ${label}`}
            aria-label={`Copiar ${label}`}
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { primaryButtonModalClass, secondaryButtonModalClass } from '../buttons/button-styles';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

const MODAL_SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '3xl': 'max-w-4xl',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions (delete) use red styling; default is danger when onConfirm is set. */
  confirmTone?: 'danger' | 'primary';
  size?: ModalSize;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  confirmTone = 'danger',
  size = 'md',
  footer,
  children,
}) => {
  const isConfirmDialog = Boolean(onConfirm) && !children;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = MODAL_SIZE_CLASS[size];

  const confirmButtonClass =
    confirmTone === 'danger'
      ? 'text-red-600 active:bg-red-50'
      : 'text-form-primary active:bg-form-primary/10';

  const desktopConfirmClass =
    confirmTone === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/30'
      : primaryButtonModalClass;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-modal-backdrop"
        aria-label="Fechar"
        onClick={onClose}
      />

      {isConfirmDialog ? (
        <>
          {/* Mobile: iOS-style action sheet */}
          <div className="relative z-10 w-full max-w-lg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden animate-modal-sheet">
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="px-4 pb-1 pt-5 text-center">
                <h3 id="modal-title" className="text-[17px] font-semibold leading-snug text-slate-900">
                  {title}
                </h3>
                {description && (
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{description}</p>
                )}
              </div>
              {onConfirm && (
                <button
                  type="button"
                  className={`w-full border-t border-slate-200 py-3.5 text-[17px] font-semibold ${confirmButtonClass}`}
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </button>
              )}
            </div>
            <button
              type="button"
              className="mt-2 w-full rounded-2xl bg-white py-3.5 text-[17px] font-semibold text-form-secondary shadow-xl active:bg-slate-50"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          </div>

          {/* Desktop: centered confirm dialog */}
          <div className="relative z-10 hidden w-full max-w-sm md:block animate-modal-dialog">
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
              <div className="px-6 pb-2 pt-6 text-center">
                <h3 id="modal-title" className="text-lg font-semibold text-slate-900">
                  {title}
                </h3>
                {description && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                )}
              </div>
              <div className="flex gap-3 border-t border-slate-100 px-4 py-4">
                <button
                  type="button"
                  className={secondaryButtonModalClass}
                  onClick={onClose}
                >
                  {cancelLabel}
                </button>
                {onConfirm && (
                  <button
                    type="button"
                    className={`${desktopConfirmClass} focus:ring-2`}
                    onClick={onConfirm}
                  >
                    {confirmLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div
          className={`relative z-10 flex max-h-[min(92dvh,720px)] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-modal-sheet md:max-h-[min(90vh,720px)] md:rounded-2xl md:animate-modal-dialog md:ring-1 md:ring-slate-900/5 ${sizeClass}`}
        >
          <div className="flex shrink-0 justify-center pt-2 md:hidden">
            <span className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
          </div>
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 pb-3 pt-2 md:px-5 md:py-4">
            <h3 id="modal-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h3>
            <button
              type="button"
              className="-mr-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:mr-0"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {description && <p className="mb-4 text-sm text-slate-600">{description}</p>}
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 py-4 md:px-6 md:py-5">
              {footer}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

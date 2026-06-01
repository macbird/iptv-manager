import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  children 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-md mx-auto my-6 z-50">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t">
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-slate-400 hover:text-slate-600 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="relative p-6 flex-auto">
            {description && <p className="text-slate-600 mb-4">{description}</p>}
            {children}
          </div>
          {(onConfirm || children) && (
            <div className="flex items-center justify-end p-6 border-t border-solid border-gray-300 rounded-b space-x-2">
              <button
                className="px-6 py-2 mb-1 mr-1 text-sm font-bold text-slate-600 uppercase transition-all duration-150 ease-linear outline-none background-transparent focus:outline-none hover:bg-slate-50 rounded"
                type="button"
                onClick={onClose}
              >
                {cancelLabel}
              </button>
              {onConfirm && (
                <button
                  className="px-6 py-2 mb-1 mr-1 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear rounded shadow outline-none bg-red-500 active:bg-red-600 hover:shadow-lg focus:outline-none"
                  type="button"
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

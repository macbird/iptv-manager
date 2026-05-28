import React from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, onConfirm, title, description }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl p-6 transition-transform transform translate-y-0 shadow-xl">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <div className="mt-6 flex flex-col md:flex-row-reverse md:gap-3 space-y-3 md:space-y-0">
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="w-full bg-red-600 text-white py-3 md:py-2 rounded-lg md:rounded-md font-semibold md:font-medium text-sm hover:bg-red-700"
          >
            Confirmar Exclusão
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 md:py-2 rounded-lg md:rounded-md font-semibold md:font-medium text-sm hover:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

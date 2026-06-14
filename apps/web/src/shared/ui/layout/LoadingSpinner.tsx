import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-50">
      <div className="w-8 h-8 border-4 border-form-primary/30 border-t-form-primary rounded-full animate-spin"></div>
    </div>
  );
};

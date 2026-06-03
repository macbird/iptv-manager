import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formInputClass, formLabelClass } from './form-styles';

interface FormPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const FormPasswordInput = React.forwardRef<HTMLInputElement, FormPasswordInputProps>(
  ({ label, error, className = '', id, value, onChange, onBlur, name, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? name?.toString();

    return (
      <label className="block" htmlFor={inputId}>
        <span className={formLabelClass}>{label}</span>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={visible ? 'text' : 'password'}
            autoComplete="off"
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            className={`${formInputClass} pr-10 ${className}`}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error ? <p className="text-red-500 text-xs mt-1">{error}</p> : null}
      </label>
    );
  },
);

FormPasswordInput.displayName = 'FormPasswordInput';

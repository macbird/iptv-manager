import React from 'react';
import { FormField } from './FormField';
import { CurrencyInput } from './CurrencyInput';
import { formInputClass, formInputPaddingDefault } from './form-styles';

export interface FormCurrencyInputProps {
  label: string;
  error?: string;
  hint?: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

export const FormCurrencyInput = React.forwardRef<HTMLInputElement, FormCurrencyInputProps>(
  ({ label, error, hint, value, onChange, onBlur, placeholder = 'R$ 0,00', id, disabled }, ref) => {
    return (
      <FormField label={label} htmlFor={id} error={error} hint={hint}>
        <CurrencyInput
          ref={ref}
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`${formInputClass} ${formInputPaddingDefault}`}
        />
      </FormField>
    );
  },
);

FormCurrencyInput.displayName = 'FormCurrencyInput';

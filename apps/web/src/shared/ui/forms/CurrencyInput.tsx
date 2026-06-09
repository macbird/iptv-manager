import React from 'react';

function formatReaisDisplay(reais: number): string {
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function digitsToReais(digits: string): number | null {
  if (!digits) return null;
  return parseInt(digits, 10) / 100;
}

function moveCaretToEnd(input: HTMLInputElement) {
  const end = input.value.length;
  input.setSelectionRange(end, end);
}

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onBlur, className, onFocus, placeholder = 'R$ 0,00', ...rest }, ref) => {
    const displayValue =
      value == null || !Number.isFinite(value) ? '' : `R$ ${formatReaisDisplay(value)}`;

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      moveCaretToEnd(event.target);
      onFocus?.(event);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const digits = event.target.value.replace(/\D/g, '');
      onChange(digitsToReais(digits));
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={handleFocus}
        onClick={(event) => moveCaretToEnd(event.currentTarget)}
        placeholder={placeholder}
        className={className}
        {...rest}
      />
    );
  },
);

CurrencyInput.displayName = 'CurrencyInput';

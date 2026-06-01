import React from 'react';

/** Formats raw input into `AA:BB:CC:DD:EE:FF` (hex pairs, max 12 nibbles). */
export function formatMacAddressValue(input: string): string {
  const hex = input.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 12);
  if (!hex) return '';

  const segments: string[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    segments.push(hex.slice(i, i + 2));
  }
  return segments.join(':');
}

interface MacAddressInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const MacAddressInput = React.forwardRef<HTMLInputElement, MacAddressInputProps>(
  ({ value, onChange, onBlur, className, onKeyDown, onPaste, ...rest }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(formatMacAddressValue(event.target.value));
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        event.key.length === 1 &&
        !/[0-9a-fA-F]/.test(event.key) &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
      }
      onKeyDown?.(event);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      onChange(formatMacAddressValue(event.clipboardData.getData('text')));
      onPaste?.(event);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        maxLength={17}
        className={className}
        {...rest}
      />
    );
  },
);

MacAddressInput.displayName = 'MacAddressInput';

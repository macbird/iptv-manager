import React from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import { FormSelect } from './FormSelect';
import { InlineFormSelect } from './InlineFormSelect';
import {
  mergeSelectOptions,
  type EntitySelectOption,
} from '../../utils/merge-select-options';

interface FormEntitySelectBaseProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  options: EntitySelectOption[];
  /** Keeps linked entities visible when excluded from selectable-only API lists. */
  ensureSelected?: Array<EntitySelectOption | null | undefined>;
  placeholderOption?: string;
  error?: string;
  hint?: string;
  prefixIcon?: LucideIcon;
  disabled?: boolean;
  className?: string;
}

export interface FormEntitySelectProps<TFieldValues extends FieldValues>
  extends FormEntitySelectBaseProps<TFieldValues> {
  label: string;
}

export interface InlineFormEntitySelectProps<TFieldValues extends FieldValues>
  extends FormEntitySelectBaseProps<TFieldValues> {}

function useMergedEntityOptions(
  options: EntitySelectOption[],
  ensureSelected: Array<EntitySelectOption | null | undefined>,
) {
  return React.useMemo(
    () => mergeSelectOptions(options, ensureSelected),
    [ensureSelected, options],
  );
}

function renderEntityOptions(
  mergedOptions: EntitySelectOption[],
  placeholderOption?: string,
) {
  return (
    <>
      {placeholderOption ? <option value="">{placeholderOption}</option> : null}
      {mergedOptions.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </>
  );
}

/**
 * Controlled entity combobox for react-hook-form fields backed by async API lists.
 * Uses Controller + option merging so the current value renders before options load.
 */
export function FormEntitySelect<TFieldValues extends FieldValues>({
  name,
  control,
  options,
  ensureSelected = [],
  placeholderOption,
  label,
  error,
  hint,
  prefixIcon,
  disabled,
  className,
}: FormEntitySelectProps<TFieldValues>) {
  const mergedOptions = useMergedEntityOptions(options, ensureSelected);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormSelect
          label={label}
          prefixIcon={prefixIcon}
          error={error}
          hint={hint}
          disabled={disabled}
          className={className}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          ref={field.ref}
        >
          {renderEntityOptions(mergedOptions, placeholderOption)}
        </FormSelect>
      )}
    />
  );
}

/** Dense variant for grids (e.g. connection rows). */
export function InlineFormEntitySelect<TFieldValues extends FieldValues>({
  name,
  control,
  options,
  ensureSelected = [],
  placeholderOption,
  error,
  prefixIcon,
  disabled,
  className,
}: InlineFormEntitySelectProps<TFieldValues>) {
  const mergedOptions = useMergedEntityOptions(options, ensureSelected);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <InlineFormSelect
          prefixIcon={prefixIcon}
          error={error}
          disabled={disabled}
          className={className}
          value={field.value ?? ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          ref={field.ref}
        >
          {renderEntityOptions(mergedOptions, placeholderOption)}
        </InlineFormSelect>
      )}
    />
  );
}

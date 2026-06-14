/** Shared button tokens — primary blue + secondary navy (reference UI). */

const primaryBase =
  'inline-flex items-center justify-center rounded-xl bg-form-primary font-semibold text-white shadow-sm transition-colors hover:bg-form-primary-hover focus:outline-none focus:ring-2 focus:ring-form-primary/30 disabled:cursor-not-allowed disabled:opacity-50';

const secondaryBase =
  'inline-flex items-center justify-center rounded-xl bg-form-secondary font-semibold text-white shadow-sm transition-colors hover:bg-form-secondary-hover focus:outline-none focus:ring-2 focus:ring-form-secondary/30 disabled:cursor-not-allowed disabled:opacity-50';

export const primaryButtonClass = `${primaryBase} px-4 py-2.5 text-sm`;

export const primaryButtonSmClass = `${primaryBase} px-3 py-2 text-sm`;

export const primaryButtonLgClass = `${primaryBase} px-4 py-3 text-sm`;

export const primaryButtonFullWidthClass = `w-full ${primaryButtonClass}`;

export const secondaryButtonClass = `${secondaryBase} px-4 py-2.5 text-sm`;

export const secondaryButtonSmClass = `${secondaryBase} px-3 py-2 text-sm`;

export const secondaryButtonFullWidthClass = `w-full ${secondaryButtonClass}`;

/** Modal / confirm dialog primary action (same palette, compact radius on some layouts). */
export const primaryButtonModalClass = `${primaryBase} flex-1 px-4 py-2.5 text-sm`;

export const secondaryButtonModalClass = `${secondaryBase} flex-1 px-4 py-2.5 text-sm`;

/** Header/list "Novo" actions (alias of primary sm). */
export const newButtonClass = primaryButtonSmClass;

/** Dashboard quick actions and full-width create links. */
export const newButtonLgClass = primaryButtonLgClass;

/** Dashed "add item" affordance (janelas, templates, etc.). */
export const newButtonDashedClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-form-primary/35 bg-form-primary/5 px-4 py-3 text-sm font-semibold text-form-primary transition-colors hover:border-form-primary/55 hover:bg-form-primary/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto';

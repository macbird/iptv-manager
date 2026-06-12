import type { ListRowAccent } from '@client-manager/shared';

export function getListRowAccentClasses(accent: ListRowAccent): string {
  switch (accent) {
    case 'muted':
      return 'border-l-4 border-l-slate-400 opacity-50 saturate-[0.65]';
    case 'danger':
      return 'border-l-4 border-l-red-500';
    case 'warning':
      return 'border-l-4 border-l-amber-500';
    case 'caution':
      return 'border-l-4 border-l-orange-500';
    default:
      return '';
  }
}

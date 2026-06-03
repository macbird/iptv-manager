import React from 'react';
import { Ban, RotateCcw } from 'lucide-react';
import { ENTITY_INACTIVE_STATUS } from '@client-manager/shared';

interface EntityLifecycleActionsProps {
  status: string;
  isPending?: boolean;
  onDeactivate: () => void;
  onActivate: () => void;
  entityLabel: string;
}

export const EntityLifecycleActions: React.FC<EntityLifecycleActionsProps> = ({
  status,
  isPending = false,
  onDeactivate,
  onActivate,
  entityLabel,
}) => {
  const isInactive = status === ENTITY_INACTIVE_STATUS;

  if (isInactive) {
    return (
      <button
        type="button"
        onClick={onActivate}
        disabled={isPending}
        className="p-2 text-slate-400 hover:text-green-600 disabled:opacity-50"
        title={`Reativar ${entityLabel}`}
        aria-label={`Reativar ${entityLabel}`}
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onDeactivate}
      disabled={isPending}
      className="p-2 text-slate-400 hover:text-amber-600 disabled:opacity-50"
      title={`Desativar ${entityLabel}`}
      aria-label={`Desativar ${entityLabel}`}
    >
      <Ban className="h-4 w-4" />
    </button>
  );
};

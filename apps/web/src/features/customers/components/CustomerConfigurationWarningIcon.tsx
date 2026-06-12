import React from 'react';
import { TriangleAlert } from 'lucide-react';
import {
  getCustomerConfigurationWarningMessage,
  hasCustomerConfigurationWarning,
  type CustomerConfigurationWarning,
} from '@client-manager/shared';

interface CustomerConfigurationWarningIconProps {
  warning: CustomerConfigurationWarning;
  className?: string;
}

export const CustomerConfigurationWarningIcon: React.FC<CustomerConfigurationWarningIconProps> = ({
  warning,
  className = 'h-3.5 w-3.5 shrink-0 text-amber-500',
}) => {
  if (!hasCustomerConfigurationWarning(warning)) {
    return null;
  }

  const message = getCustomerConfigurationWarningMessage(warning);
  if (!message) {
    return null;
  }

  return (
    <span title={message} className="inline-flex" aria-label={message}>
      <TriangleAlert className={className} />
    </span>
  );
};

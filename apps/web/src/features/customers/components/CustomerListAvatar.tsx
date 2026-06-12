import React from 'react';
import {
  hasCustomerConfigurationWarning,
  type CustomerConfigurationWarning,
} from '@client-manager/shared';
import { CustomerConfigurationWarningIcon } from './CustomerConfigurationWarningIcon';

interface CustomerListAvatarProps {
  name: string;
  warning: CustomerConfigurationWarning;
  size?: 'sm' | 'md';
}

function customerInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export const CustomerListAvatar: React.FC<CustomerListAvatarProps> = ({
  name,
  warning,
  size = 'md',
}) => {
  const dimension = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const initialsClass = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  if (hasCustomerConfigurationWarning(warning)) {
    return (
      <div
        className={`flex ${dimension} shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50`}
      >
        <CustomerConfigurationWarningIcon
          warning={warning}
          className={`${iconClass} text-amber-500`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50`}
    >
      <span className={`${initialsClass} font-bold text-slate-500`}>{customerInitials(name)}</span>
    </div>
  );
};

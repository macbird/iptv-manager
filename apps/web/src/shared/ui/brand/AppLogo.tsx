import React from 'react';
import { APP_LOGO_PATH, APP_NAME } from '@client-manager/shared';

type AppLogoSize = 'sm' | 'md' | 'lg';

const heightBySize: Record<AppLogoSize, string> = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
};

interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', className = '' }) => (
  <img
    src={APP_LOGO_PATH}
    alt={APP_NAME}
    className={['w-auto max-w-full object-contain object-left', heightBySize[size], className]
      .filter(Boolean)
      .join(' ')}
  />
);

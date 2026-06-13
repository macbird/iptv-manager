import React from 'react';
import { APP_NAME } from '@client-manager/shared';
import { AppLogo } from '../brand/AppLogo';

type AuthVariant = 'tenant' | 'admin';

interface AuthShellProps {
  variant: AuthVariant;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const branding: Record<
  AuthVariant,
  {
    tagline: string;
    panelClass: string;
    accentClass: string;
  }
> = {
  tenant: {
    tagline: 'Gestão de clientes, planos e servidores em um só lugar.',
    panelClass:
      'bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 text-white',
    accentClass: 'text-slate-300',
  },
  admin: {
    tagline: 'Administração de contas e acesso dos revendedores.',
    panelClass: 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white',
    accentClass: 'text-slate-300',
  },
};

export const AuthShell: React.FC<AuthShellProps> = ({
  variant,
  title,
  subtitle,
  children,
  footer,
}) => {
  const brand = branding[variant];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside
        className={`relative hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-10 xl:p-14 overflow-hidden ${brand.panelClass}`}
      >
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-black/10 blur-2xl"
          aria-hidden
        />

        <div className="relative z-10">
          <AppLogo size="lg" />
        </div>

        <div className="relative z-10 max-w-md">
          <p className={`text-sm font-medium uppercase tracking-widest ${brand.accentClass} mb-3`}>
            {variant === 'admin' ? 'Acesso restrito' : 'Área do revendedor'}
          </p>
          <p className="text-2xl xl:text-3xl font-bold leading-snug text-white">
            {brand.tagline}
          </p>
        </div>

        <p className={`relative z-10 text-xs ${brand.accentClass}`}>
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </aside>

      <main className="flex flex-1 flex-col justify-center bg-form-field px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <AppLogo size="md" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm shadow-slate-200/50">
            {children}
          </div>

          {footer ? <div className="mt-6 text-center text-sm text-slate-500">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
};

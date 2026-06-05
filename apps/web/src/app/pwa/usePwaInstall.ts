import React from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = React.useState(false);
  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const onInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = React.useCallback(async () => {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return false;

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    deferredPromptRef.current = null;
    setCanInstall(false);
    return choice.outcome === 'accepted';
  }, []);

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return { canInstall, install, isStandalone };
}

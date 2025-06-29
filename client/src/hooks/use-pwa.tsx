// Stub file - PWA functionality has been removed
// This file exists to prevent module loading errors

export function usePWA() {
  return {
    isInstallable: false,
    isInstalled: false,
    install: () => Promise.resolve(),
    isSupported: false,
  };
}

export default usePWA;
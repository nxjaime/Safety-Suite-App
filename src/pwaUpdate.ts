import { registerSW } from 'virtual:pwa-register';

const UPDATE_RELOAD_KEY = 'safetyhub:pwa-update-reload-at';
const RELOAD_DEBOUNCE_MS = 10_000;
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const reloadForFreshAppShell = () => {
  const lastReloadAt = Number(sessionStorage.getItem(UPDATE_RELOAD_KEY) || 0);

  if (Date.now() - lastReloadAt < RELOAD_DEBOUNCE_MS) {
    return;
  }

  sessionStorage.setItem(UPDATE_RELOAD_KEY, String(Date.now()));
  window.location.reload();
};

export const registerPwaUpdateHandler = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateServiceWorker().finally(reloadForFreshAppShell);
    },
    onNeedReload() {
      reloadForFreshAppShell();
    },
    onRegisteredSW(_swScriptUrl, registration) {
      if (!registration) {
        return;
      }

      window.setInterval(() => {
        registration.update().catch(() => {});
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });
};

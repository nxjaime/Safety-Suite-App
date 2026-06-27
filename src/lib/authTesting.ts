// Temporary testing switch: disables the login/auth gate while the app is being tested.
// Production and local development must use the real auth gate by default.
export const TEMP_AUTH_DISABLED_FOR_TESTING = false;

export const isAuthBypassEnabled = () =>
    (import.meta.env.MODE === 'test' && TEMP_AUTH_DISABLED_FOR_TESTING) ||
    import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

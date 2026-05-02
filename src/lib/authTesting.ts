// Temporary testing switch: disables the login/auth gate while the app is being tested.
// Set this back to false when authentication is ready to be re-enabled.
export const TEMP_AUTH_DISABLED_FOR_TESTING = true;

export const isAuthBypassEnabled = () =>
    TEMP_AUTH_DISABLED_FOR_TESTING ||
    import.meta.env.VITE_DISABLE_AUTH === 'true' ||
    import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

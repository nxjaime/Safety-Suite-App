export const getLoadErrorMessage = (error: unknown, resourceName: string) => {
    const rawMessage = error instanceof Error ? error.message : String(error || '');
    const message = rawMessage.toLowerCase();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return `You're offline. ${resourceName} will refresh when the connection is restored.`;
    }

    if (message.includes('jwt') || message.includes('auth') || message.includes('401') || message.includes('403')) {
        return `Your session does not have access to ${resourceName.toLowerCase()}. Sign in again or ask an admin to verify your role.`;
    }

    if (message.includes('supabase') || message.includes('environment') || message.includes('configured') || message.includes('missing')) {
        return `${resourceName} could not load because the backend configuration is incomplete. Verify Supabase and environment settings.`;
    }

    if (message.includes('failed to fetch') || message.includes('network') || message.includes('timeout')) {
        return `${resourceName} could not load because the backend is unreachable. Check the connection and try again.`;
    }

    return `${resourceName} could not load. Refresh the page or try again in a few minutes.`;
};

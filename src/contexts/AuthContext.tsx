import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
    canAccessPlatformAdmin,
    getRoleCapabilities,
    normalizeRole,
    type ProfileRole,
    type RoleCapabilities
} from '../services/authorizationService';
import { profileService } from '../services/profileService';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    organizationId: string | null;
    role: ProfileRole;
    capabilities: RoleCapabilities;
    isAdmin: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [role, setRole] = useState<ProfileRole>('readonly');
    const [loading, setLoading] = useState(true);
    const isE2EAuthBypass = import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

    useEffect(() => {
        if (isE2EAuthBypass) {
            const mockUser = {
                id: 'e2e-user',
                email: 'e2e@safetyhub.local',
                aud: 'authenticated',
                app_metadata: {},
                user_metadata: {
                    full_name: 'E2E User',
                    title: 'QA Automation',
                    role: 'platform_admin'
                },
                created_at: new Date().toISOString()
            } as User;

            const mockSession = {
                access_token: 'e2e-access-token',
                refresh_token: 'e2e-refresh-token',
                token_type: 'bearer',
                expires_in: 3600,
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                user: mockUser
            } as Session;

            setSession(mockSession);
            setUser(mockUser);
            setOrganizationId('e2e-org');
            setRole('platform_admin');
            setLoading(false);
            return;
        }

        const resolveRole = async (nextUser: User | null) => {
            if (!nextUser) {
                setOrganizationId(null);
                setRole('readonly');
                return;
            }

            const metadataRole = normalizeRole(String(nextUser.user_metadata?.role || '').toLowerCase() as ProfileRole);
            const summary = await profileService.getCurrentProfileSummary();
            const isEmailAdmin = profileService.isEmailAdmin(nextUser.email || '');

            if (metadataRole === 'platform_admin' || isEmailAdmin) {
                setOrganizationId(summary?.organizationId || null);
                setRole('platform_admin');
                return;
            }

            setOrganizationId(summary?.organizationId || null);
            setRole(summary?.role || 'readonly');
        };

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            resolveRole(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            resolveRole(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [isE2EAuthBypass]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const signUp = async (email: string, password: string, metadata?: any) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
        return { error };
    };

    const capabilities = getRoleCapabilities(role);
    const isAdmin = canAccessPlatformAdmin(role) || profileService.isEmailAdmin(user?.email || '');

    return (
        <AuthContext.Provider value={{ session, user, organizationId, role, capabilities, isAdmin, loading, signOut, signUp }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

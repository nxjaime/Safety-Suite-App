import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
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
                    title: 'QA Automation'
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
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
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

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut, signUp }}>
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

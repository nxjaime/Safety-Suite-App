import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, { full_name: fullName });
                if (error) throw error;
                setIsSuccess(true);
                toast.success('Check your email to verify your account!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                navigate('/');
            }
        } catch (error: any) {
            console.error('Auth error:', error.message);
            toast.error(error.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Side - Credentials */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white border-r border-slate-200 w-full max-w-lg">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="flex flex-col items-center lg:items-start">
                         <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg mb-6">
                            <Lock className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900">
                            {isSignUp ? 'Create your account' : 'Sign in to SafetyHub'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            {isSignUp ? 'Join the leading safety management platform' : 'Welcome back! Please enter your details.'}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                            <Link to="/" className="text-emerald-600 hover:text-emerald-500 font-medium">← Back to Home</Link>
                        </p>
                    </div>

                    <div className="mt-8">
                        {isSuccess ? (
                            <div className="text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">Registration Successful!</h3>
                                <p className="text-sm text-slate-500">
                                    We've sent a confirmation email to <span className="font-semibold text-slate-700">{email}</span>.
                                    Please click the link in the email to verify your account.
                                </p>
                                <button
                                    onClick={() => {
                                        setIsSuccess(false);
                                        setIsSignUp(false);
                                    }}
                                    className="w-full flex justify-center py-2 px-4 border border-emerald-600 rounded-md shadow-sm text-sm font-medium text-emerald-600 hover:bg-emerald-50 focus:outline-none"
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        ) : (
                            <div className="mt-6">
                                <form action="#" method="POST" className="space-y-6" onSubmit={handleAuth}>
                                    {isSignUp && (
                                        <div>
                                            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                                                Full Name
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    id="fullName"
                                                    name="fullName"
                                                    type="text"
                                                    required={isSignUp}
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                            Email address
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                            Password
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    {!isSignUp && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <input
                                                    id="remember-me"
                                                    name="remember-me"
                                                    type="checkbox"
                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded"
                                                />
                                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                                                    Remember me
                                                </label>
                                            </div>

                                            <div className="text-sm">
                                                <a href="#" className="font-medium text-green-600 hover:text-green-500">
                                                    Forgot your password?
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign in')}
                                            {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                                        </button>
                                    </div>

                                    <div className="mt-6 text-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSignUp(!isSignUp);
                                                setIsSuccess(false);
                                            }}
                                            className="text-sm font-medium text-green-600 hover:text-green-500"
                                        >
                                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:block relative w-0 flex-1">
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80"
                    alt="SafetyHub Logistics"
                />
                <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply" />
            </div>
        </div>
    );
};

export default Login;

import React, { Suspense } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';
import { lazyWithReload } from '../lib/lazyWithReload';

const Login = lazyWithReload(() => import('../pages/Login'));

const LoginRoute: React.FC = () => (
  <AuthProvider>
    <ErrorBoundary>
      <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
        <Login />
      </Suspense>
    </ErrorBoundary>
  </AuthProvider>
);

export default LoginRoute;

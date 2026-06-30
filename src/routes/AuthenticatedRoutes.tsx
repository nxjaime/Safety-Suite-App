import React, { Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { isAuthBypassEnabled } from '../lib/authTesting';
import { lazyWithReload } from '../lib/lazyWithReload';
import { canAccessPlatformAdmin } from '../services/authorizationService';

const AuthenticatedLayout = lazyWithReload(() => import('../components/Layout/AuthenticatedLayout'));
const Dashboard = lazyWithReload(() => import('../pages/Dashboard'));
const Drivers = lazyWithReload(() => import('../pages/Drivers'));
const DriverProfile = lazyWithReload(() => import('../pages/DriverProfile'));
const Tasks = lazyWithReload(() => import('../pages/Tasks'));
const Safety = lazyWithReload(() => import('../pages/Safety'));
const Watchlist = lazyWithReload(() => import('../pages/Watchlist'));
const Training = lazyWithReload(() => import('../pages/Training'));
const Compliance = lazyWithReload(() => import('../pages/Compliance'));
const Equipment = lazyWithReload(() => import('../pages/Equipment'));
const Maintenance = lazyWithReload(() => import('../pages/Maintenance'));
const WorkOrders = lazyWithReload(() => import('../pages/WorkOrders'));
const Reporting = lazyWithReload(() => import('../pages/Reporting'));
const Hypercare = lazyWithReload(() => import('../pages/Hypercare'));
const CSAPredictor = lazyWithReload(() => import('../pages/CSAPredictor'));
const Documents = lazyWithReload(() => import('../pages/Documents'));
const FMCSA = lazyWithReload(() => import('../pages/FMCSA'));
const Settings = lazyWithReload(() => import('../pages/Settings'));
const UserProfile = lazyWithReload(() => import('../pages/UserProfile'));
const HelpFeedback = lazyWithReload(() => import('../pages/HelpFeedback'));
const AdminDashboard = lazyWithReload(() => import('../pages/AdminDashboard'));
const DriverPortal = lazyWithReload(() => import('../pages/DriverPortal'));

const LoadingScreen = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

const RouteSuspense = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>{children}</Suspense>
  </ErrorBoundary>
);

const ProtectedRoute = () => {
  const { session, loading, role } = useAuth();
  const location = useLocation();
  const isE2EAuthBypass = isAuthBypassEnabled();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session && !isE2EAuthBypass) {
    return <Navigate to="/login" replace />;
  }

  const driverRole = role === 'driver';
  if (driverRole && location.pathname !== '/driver-portal') {
    return <Navigate to="/driver-portal" replace />;
  }

  if (!driverRole && location.pathname === '/driver-portal') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AdminRoute = () => {
  const { loading, role, capabilities } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const isE2EAuthBypass = isAuthBypassEnabled();
  const hasPlatformAdminAccess = capabilities?.canAccessPlatformAdmin ?? canAccessPlatformAdmin(role);

  if (!hasPlatformAdminAccess && !isE2EAuthBypass) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AuthenticatedRoutes: React.FC = () => (
  <AuthProvider>
    <Routes>
      <Route path="driver-portal" element={<ProtectedRoute />}>
        <Route index element={<RouteSuspense><DriverPortal /></RouteSuspense>} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RouteSuspense><AuthenticatedLayout /></RouteSuspense>}>
          <Route index element={<RouteSuspense><Dashboard /></RouteSuspense>} />
          <Route path="dashboard" element={<RouteSuspense><Dashboard /></RouteSuspense>} />
          <Route path="drivers" element={<RouteSuspense><Drivers /></RouteSuspense>} />
          <Route path="drivers/:id" element={<RouteSuspense><DriverProfile /></RouteSuspense>} />
          <Route path="tasks" element={<RouteSuspense><Tasks /></RouteSuspense>} />
          <Route path="safety" element={<RouteSuspense><Safety /></RouteSuspense>} />
          <Route path="watchlist" element={<RouteSuspense><Watchlist /></RouteSuspense>} />
          <Route path="training" element={<RouteSuspense><Training /></RouteSuspense>} />
          <Route path="compliance" element={<RouteSuspense><Compliance /></RouteSuspense>} />
          <Route path="equipment" element={<RouteSuspense><Equipment /></RouteSuspense>} />
          <Route path="maintenance" element={<RouteSuspense><Maintenance /></RouteSuspense>} />
          <Route path="work-orders" element={<RouteSuspense><WorkOrders /></RouteSuspense>} />
          <Route path="reporting" element={<RouteSuspense><Reporting /></RouteSuspense>} />
          <Route path="reporting/hypercare" element={<RouteSuspense><Hypercare /></RouteSuspense>} />
          <Route path="reporting/csa-predictor" element={<RouteSuspense><CSAPredictor /></RouteSuspense>} />
          <Route path="documents" element={<RouteSuspense><Documents /></RouteSuspense>} />
          <Route path="fmcsa" element={<RouteSuspense><FMCSA /></RouteSuspense>} />
          <Route path="settings" element={<RouteSuspense><Settings /></RouteSuspense>} />
          <Route path="profile" element={<RouteSuspense><UserProfile /></RouteSuspense>} />
          <Route path="help" element={<RouteSuspense><HelpFeedback /></RouteSuspense>} />
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<RouteSuspense><AdminDashboard /></RouteSuspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  </AuthProvider>
);

export default AuthenticatedRoutes;

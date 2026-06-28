import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { isAuthBypassEnabled } from './lib/authTesting';
import { lazyWithReload } from './lib/lazyWithReload';
import { canAccessPlatformAdmin } from './services/authorizationService';

// Lazy load pages
const Dashboard = lazyWithReload(() => import('./pages/Dashboard'));
const Drivers = lazyWithReload(() => import('./pages/Drivers'));
const DriverProfile = lazyWithReload(() => import('./pages/DriverProfile'));
const Tasks = lazyWithReload(() => import('./pages/Tasks'));
const Safety = lazyWithReload(() => import('./pages/Safety'));
const Watchlist = lazyWithReload(() => import('./pages/Watchlist'));
const Training = lazyWithReload(() => import('./pages/Training'));
const Compliance = lazyWithReload(() => import('./pages/Compliance'));
const Equipment = lazyWithReload(() => import('./pages/Equipment'));
const Maintenance = lazyWithReload(() => import('./pages/Maintenance'));
const WorkOrders = lazyWithReload(() => import('./pages/WorkOrders'));
const Reporting = lazyWithReload(() => import('./pages/Reporting'));
const Hypercare = lazyWithReload(() => import('./pages/Hypercare'));
const CSAPredictor = lazyWithReload(() => import('./pages/CSAPredictor'));
const Documents = lazyWithReload(() => import('./pages/Documents'));
const FMCSA = lazyWithReload(() => import('./pages/FMCSA'));
const Settings = lazyWithReload(() => import('./pages/Settings'));
const UserProfile = lazyWithReload(() => import('./pages/UserProfile'));
const Landing = lazyWithReload(() => import('./pages/Landing'));
const Login = lazyWithReload(() => import('./pages/Login'));
const HelpFeedback = lazyWithReload(() => import('./pages/HelpFeedback'));
const AdminDashboard = lazyWithReload(() => import('./pages/AdminDashboard'));
const DriverPortal = lazyWithReload(() => import('./pages/DriverPortal'));


import { useAuth } from './contexts/AuthContext';

// Simple Protected Route Component
const ProtectedRoute = () => {
  const { session, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isE2EAuthBypass = isAuthBypassEnabled();
  const driverRole = String(user?.user_metadata?.role || '').toLowerCase() === 'driver';
  if (driverRole && location.pathname !== '/driver-portal') {
    return <Navigate to="/driver-portal" replace />;
  }

  if (!session && !isE2EAuthBypass) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AdminRoute = () => {
  const { loading, role, capabilities } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isE2EAuthBypass = isAuthBypassEnabled();
  const hasPlatformAdminAccess = capabilities?.canAccessPlatformAdmin ?? canAccessPlatformAdmin(role);

  if (!hasPlatformAdminAccess && !isE2EAuthBypass) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/welcome" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Landing /></Suspense></ErrorBoundary>} />
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Login /></Suspense></ErrorBoundary>} />
        <Route path="/driver-portal" element={<ProtectedRoute />}>
          <Route index element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><DriverPortal /></Suspense></ErrorBoundary>} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Dashboard /></Suspense></ErrorBoundary>} />
            <Route path="dashboard" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Dashboard /></Suspense></ErrorBoundary>} />
            <Route path="drivers" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Drivers /></Suspense></ErrorBoundary>} />
            <Route path="drivers/:id" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><DriverProfile /></Suspense></ErrorBoundary>} />
            <Route path="tasks" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Tasks /></Suspense></ErrorBoundary>} />
            <Route path="safety" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Safety /></Suspense></ErrorBoundary>} />
            <Route path="watchlist" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Watchlist /></Suspense></ErrorBoundary>} />
            <Route path="training" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Training /></Suspense></ErrorBoundary>} />
            <Route path="compliance" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Compliance /></Suspense></ErrorBoundary>} />
            <Route path="equipment" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Equipment /></Suspense></ErrorBoundary>} />
            <Route path="maintenance" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Maintenance /></Suspense></ErrorBoundary>} />
            <Route path="work-orders" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><WorkOrders /></Suspense></ErrorBoundary>} />
            <Route path="reporting" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Reporting /></Suspense></ErrorBoundary>} />
            <Route path="reporting/hypercare" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Hypercare /></Suspense></ErrorBoundary>} />
            <Route path="reporting/csa-predictor" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><CSAPredictor /></Suspense></ErrorBoundary>} />
            <Route path="documents" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Documents /></Suspense></ErrorBoundary>} />
            <Route path="fmcsa" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><FMCSA /></Suspense></ErrorBoundary>} />
            <Route path="settings" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Settings /></Suspense></ErrorBoundary>} />
            <Route path="profile" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><UserProfile /></Suspense></ErrorBoundary>} />
            <Route path="help" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><HelpFeedback /></Suspense></ErrorBoundary>} />
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><AdminDashboard /></Suspense></ErrorBoundary>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

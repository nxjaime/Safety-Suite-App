import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Drivers = lazy(() => import('./pages/Drivers'));
const DriverProfile = lazy(() => import('./pages/DriverProfile'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Safety = lazy(() => import('./pages/Safety'));
const Training = lazy(() => import('./pages/Training'));
const Compliance = lazy(() => import('./pages/Compliance'));
const Equipment = lazy(() => import('./pages/Equipment'));
const Reporting = lazy(() => import('./pages/Reporting'));
const Documents = lazy(() => import('./pages/Documents'));
const FMCSA = lazy(() => import('./pages/FMCSA'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const UserProfile = lazy(() => import('./pages/UserProfile'));


// Simple Protected Route Component
const ProtectedRoute = () => {
  // Deactivating login for now as per user request
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Dashboard /></Suspense>} />
            <Route path="drivers" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Drivers /></Suspense>} />
            <Route path="drivers/:id" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><DriverProfile /></Suspense>} />
            <Route path="tasks" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Tasks /></Suspense>} />
            <Route path="safety" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Safety /></Suspense>} />
            <Route path="training" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Training /></Suspense>} />
            <Route path="compliance" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Compliance /></Suspense>} />
            <Route path="equipment" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Equipment /></Suspense>} />
            <Route path="reporting" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Reporting /></Suspense>} />
            <Route path="documents" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Documents /></Suspense>} />
            <Route path="fmcsa" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><FMCSA /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Settings /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><UserProfile /></Suspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

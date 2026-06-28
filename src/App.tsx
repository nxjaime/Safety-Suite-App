import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import { lazyWithReload } from './lib/lazyWithReload';

const Landing = lazyWithReload(() => import('./pages/Landing'));
const LoginRoute = lazyWithReload(() => import('./routes/LoginRoute'));
const AuthenticatedRoutes = lazyWithReload(() => import('./routes/AuthenticatedRoutes'));

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/welcome" element={<ErrorBoundary><Suspense fallback={<div className="p-10 text-center">Loading...</div>}><Landing /></Suspense></ErrorBoundary>} />
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Suspense fallback={<div className="p-10 text-center">Loading...</div>}><LoginRoute /></Suspense>} />
        <Route path="/*" element={<Suspense fallback={<div className="p-10 text-center">Loading workspace...</div>}><AuthenticatedRoutes /></Suspense>} />
      </Routes>
    </Router>
  );
}

export default App;

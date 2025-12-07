import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import DriverProfile from './pages/DriverProfile';
import Tasks from './pages/Tasks';
import Safety from './pages/Safety';
import Training from './pages/Training';
import Compliance from './pages/Compliance';
import Equipment from './pages/Equipment';
import SafeView from './pages/SafeView';
import Documents from './pages/Documents';
import FMCSA from './pages/FMCSA';
import Settings from './pages/Settings';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';

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
            <Route index element={<Dashboard />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="drivers/:id" element={<DriverProfile />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="safety" element={<Safety />} />
            <Route path="training" element={<Training />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="safeview" element={<SafeView />} />
            <Route path="documents" element={<Documents />} />
            <Route path="fmcsa" element={<FMCSA />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

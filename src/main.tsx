import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

if (!isSupabaseConfigured) {
  createRoot(rootElement).render(
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border border-red-100">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Configuration Required</h1>
        <p className="text-gray-600 mb-6">
          The application is missing required Supabase configuration. Please ensure <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> are set in your environment variables.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-emerald-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  );
}

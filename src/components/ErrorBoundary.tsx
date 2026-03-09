import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackHref?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production this would forward to an observability service
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleNavigate = () => {
    const href = this.props.fallbackHref ?? '/';
    window.location.href = href;
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-500 mb-1 max-w-sm">
          An unexpected error occurred in this section. Your other data is safe.
        </p>
        {this.state.error?.message && (
          <p className="text-xs text-slate-400 font-mono bg-slate-50 px-3 py-1.5 rounded mb-6 max-w-sm truncate">
            {this.state.error.message}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload page
          </button>
          <button
            onClick={this.handleNavigate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

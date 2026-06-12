import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    // Clear potentially corrupted local storage keys
    localStorage.removeItem('pulse_user');
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_theme');
    // Clear all cache storages
    if ('caches' in window) {
      caches.keys().then(names => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
    // Hard reload the page
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Pulse encountered a rendering issue. This is often caused by cached system assets or corrupted session data. Click below to clear your site settings and reload.
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-100 dark:bg-slate-950 p-4 rounded-xl mb-6 border border-slate-200 dark:border-slate-800 overflow-auto max-h-32 text-xs font-mono text-red-600 dark:text-red-400">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium rounded-xl shadow transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 animate-spin-slow">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Clear Cache & Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

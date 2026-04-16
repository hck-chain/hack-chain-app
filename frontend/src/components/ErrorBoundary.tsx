import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches render errors and displays
 * a recovery UI instead of a white screen.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log for debugging — ready for Sentry/LogRocket integration
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
            <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 font-title">
              Something went wrong
            </h2>

            <p className="text-slate-400 mb-6 font-body text-sm">
              An unexpected error occurred. Please try reloading the page.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-black/40 rounded-lg text-xs text-red-300 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-body"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

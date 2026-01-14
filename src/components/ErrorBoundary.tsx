import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
    // TODO: Send to error tracking service (e.g., Sentry) in production
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Er is iets misgegaan
            </h1>
            <p className="text-gray-600 mb-6">
              De applicatie heeft een onverwachte fout ondervonden. Probeer de pagina opnieuw te laden.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-left">
                <p className="text-xs font-mono text-red-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Pagina herladen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

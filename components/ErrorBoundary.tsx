'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="glass-card flex flex-col items-center justify-center p-8 space-y-4 max-w-lg mx-auto mt-20">
          <h2 className="text-[var(--accent-red)] text-xl font-semibold">Something went wrong</h2>
          <p className="text-[var(--text-secondary)] text-sm text-center break-words max-w-full">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn-glass"
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

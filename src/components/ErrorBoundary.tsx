import React, { Component, ErrorInfo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.logError(error, errorInfo);
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('error_logs').insert({
        user_id: user?.id ?? null,
        error_message: error.message,
        error_stack: error.stack ?? null,
        component_stack: errorInfo.componentStack ?? null,
        url: window.location.href,
        user_agent: navigator.userAgent,
      });
    } catch {
      console.error('Failed to log error to database');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full rounded-lg border bg-card text-card-foreground shadow-lg p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive text-xl">⚠</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Something went wrong</h2>
                <p className="text-sm text-muted-foreground">
                  An unexpected error occurred. Our team has been notified.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                Reload Page
              </button>
              <button
                onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                {this.state.showDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>

            {this.state.showDetails && this.state.error && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

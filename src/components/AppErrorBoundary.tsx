import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  props!: Readonly<AppErrorBoundaryProps>;
  state: AppErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unknown rendering error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep browser console trace for debugging.
    console.error('Screen rendering error:', error, info);
    try {
      localStorage.setItem(
        'guestseat:lastError',
        JSON.stringify({
          message: error?.message || 'Unknown rendering error',
          stack: error?.stack || '',
          componentStack: info.componentStack || '',
          at: new Date().toISOString(),
        })
      );
    } catch {
      // no-op
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
        <p className="font-semibold text-destructive">This screen failed to render.</p>
        <p className="mt-1 text-muted-foreground">{this.state.message}</p>
        <p className="mt-2 text-muted-foreground">
          Reload the page and try again. If this keeps happening, share the failing screen name.
        </p>
      </div>
    );
  }
}


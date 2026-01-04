import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh w-full flex flex-col items-center justify-center bg-background p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h1 className="text-xl font-medium text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium
              hover:opacity-90 transition-opacity"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

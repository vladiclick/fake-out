import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#7f1d1d',
          color: '#fef2f2',
          fontFamily: 'monospace',
          height: '100vh',
          overflow: 'auto',
          zIndex: 9999,
          position: 'fixed',
          inset: 0
        }}>
          <h2>Something went wrong in the App.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#450a0a', padding: '10px', borderRadius: '4px' }}>
            {this.state.error?.stack || this.state.error?.toString()}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#450a0a', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

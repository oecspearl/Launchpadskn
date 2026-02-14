import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    try {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      if (import.meta.env.DEV) {
        console.error('ErrorBoundary caught an error:', errorMessage, errorInfo?.componentStack);
      }
    } catch {
      // Ignore logging failures
    }
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="mt-5">
          <Alert variant="danger">
            <Alert.Heading>Something went wrong</Alert.Heading>
            <p>The application encountered an error. You can try again or reload the page.</p>
            <div className="d-flex gap-2 mt-3">
              <Button variant="primary" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant="outline-secondary" onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-3">
                <summary>Error Details (dev only)</summary>
                <pre className="mt-2" style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
                  {this.state.error?.message || 'Unknown error'}
                  {this.state.error?.stack && `\n\nStack Trace:\n${this.state.error.stack}`}
                  {this.state.errorInfo?.componentStack && `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                </pre>
              </details>
            )}
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

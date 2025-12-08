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
    // Safely log error to avoid "Cannot convert object to primitive value" errors
    try {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      const componentStack = errorInfo?.componentStack || 'No component stack';
      console.error('ErrorBoundary caught an error:', errorMessage, '\nStack:', errorStack, '\nComponent Stack:', componentStack);
    } catch (logError) {
      // If logging fails, just set state without logging
      console.error('ErrorBoundary: Failed to log error details');
    }
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="mt-5">
          <Alert variant="danger">
            <Alert.Heading>Something went wrong</Alert.Heading>
            <p>The application encountered an error. Please try reloading the page.</p>
            {this.state.error && (
              <details className="mt-3">
                <summary>Error Details</summary>
                <pre className="mt-2" style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
                  {this.state.error?.message || this.state.error?.toString() || 'Unknown error'}
                  {this.state.error?.stack && (
                    <>
                      {'\n\nStack Trace:\n'}
                      {this.state.error.stack}
                    </>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            <Button variant="primary" onClick={this.handleReload} className="mt-3">
              Reload Page
            </Button>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


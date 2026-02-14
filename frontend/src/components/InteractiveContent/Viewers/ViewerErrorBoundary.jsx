import React from 'react';
import { Alert, Button } from 'react-bootstrap';

class ViewerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Viewer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-5">
          <Alert variant="warning">
            <h6>{this.props.viewerType || 'Viewer'} Unavailable</h6>
            <p>
              The {this.props.viewerType?.toLowerCase() || 'viewer'} is currently unavailable due to React 19 compatibility issues.
              <br />
              We're working on a fix. In the meantime, you can access the content via external link.
            </p>
            {this.props.contentUrl && (
              <Button variant="outline-primary" href={this.props.contentUrl} target="_blank" className="mt-2">
                Open External Link
              </Button>
            )}
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ViewerErrorBoundary;


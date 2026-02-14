import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

function NotFound() {
  const navigate = useNavigate();

  return (
    <Container className="py-5">
      <Card className="text-center border-0 shadow-sm">
        <Card.Body className="py-5">
          <div className="mb-4">
            <h1 className="display-1 text-muted">404</h1>
            <h2 className="mb-3">Page Not Found</h2>
            <p className="text-muted mb-4">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              <FaHome className="me-2" />
              Go Home
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="me-2" />
              Go Back
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default NotFound;


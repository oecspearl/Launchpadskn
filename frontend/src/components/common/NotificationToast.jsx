import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FaCheck, FaTimes, FaInfo, FaExclamationTriangle } from 'react-icons/fa';

function NotificationToast({ show, onClose, type = 'info', title, message, autoHide = true, delay = 5000 }) {
  const [showToast, setShowToast] = useState(show);

  useEffect(() => {
    setShowToast(show);
  }, [show]);

  const handleClose = () => {
    setShowToast(false);
    if (onClose) onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheck className="me-2" />;
      case 'error':
        return <FaTimes className="me-2" />;
      case 'warning':
        return <FaExclamationTriangle className="me-2" />;
      default:
        return <FaInfo className="me-2" />;
    }
  };

  const getBgVariant = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      <Toast 
        show={showToast} 
        onClose={handleClose} 
        autohide={autoHide} 
        delay={delay}
        bg={getBgVariant()}
        className="text-white"
      >
        <Toast.Header closeButton={true} className={`bg-${getBgVariant()} text-white border-0`}>
          <div className="d-flex align-items-center">
            {getIcon()}
            <strong className="me-auto">{title}</strong>
          </div>
        </Toast.Header>
        {message && (
          <Toast.Body>
            {message}
          </Toast.Body>
        )}
      </Toast>
    </ToastContainer>
  );
}

export default NotificationToast;
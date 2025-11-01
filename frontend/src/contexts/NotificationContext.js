import React, { createContext, useContext, useState } from 'react';
import NotificationToast from '../components/common/NotificationToast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (type, title, message, autoHide = true, delay = 5000) => {
    const id = Date.now();
    const notification = { id, type, title, message, autoHide, delay, show: true };
    
    setNotifications(prev => [...prev, notification]);
    
    if (autoHide) {
      setTimeout(() => {
        removeNotification(id);
      }, delay);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (title, message) => showNotification('success', title, message);
  const showError = (title, message) => showNotification('error', title, message);
  const showWarning = (title, message) => showNotification('warning', title, message);
  const showInfo = (title, message) => showNotification('info', title, message);

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      removeNotification
    }}>
      {children}
      
      {/* Render all notifications */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            show={notification.show}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            autoHide={notification.autoHide}
            delay={notification.delay}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
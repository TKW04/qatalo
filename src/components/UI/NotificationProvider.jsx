import { useState, useCallback } from "react";
import Notification from "./Notification";
import NotificationContext, { useNotification } from "./NotificationContext";

export { useNotification };

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((status, title, message) => {
    const notificationData = { status, title, message, timestamp: Date.now() };
    setNotification(notificationData);
  }, []);

  const showSuccess = useCallback(
    (title, message) => {
      showNotification("success", title, message);
    },
    [showNotification]
  );

  const showError = useCallback(
    (title, message) => {
      showNotification("error", title, message);
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (title, message) => {
      showNotification("warning", title, message);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (title, message) => {
      showNotification("info", title, message);
    },
    [showNotification]
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notification && (
        <div style={{ position: "relative", zIndex: 9999 }}>
          <Notification
            status={notification.status}
            title={notification.title}
            message={notification.message}
            onClose={clearNotification}
          />
        </div>
      )}
    </NotificationContext.Provider>
  );
};

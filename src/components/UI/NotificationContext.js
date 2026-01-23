
import { createContext, useContext } from "react";

const NotificationContext = createContext({
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
  clearNotification: () => {},
});

export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context || !context.showSuccess) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }

  return context;
};

export default NotificationContext;

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import Notification from "./Notification";

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;
const MAX_VISIBLE = 4;

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
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    // 1) marca el toast como "saliendo" para disparar la animación
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    // corta el timer de auto-cierre si seguía vivo
    const tm = timers.current.get(id);
    if (tm) { clearTimeout(tm); timers.current.delete(id); }
    // 2) lo remueve cuando termina la animación (debe coincidir con el CSS: 0.3s)
    const rm = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(`rm-${id}`);
    }, 300);
    timers.current.set(`rm-${id}`, rm);
  }, []);

  const push = useCallback((status, title, message, duration) => {
    const ms = duration ?? (status === "error" ? ERROR_DURATION : DEFAULT_DURATION);
    const id = ++idRef.current;
    setToasts((prev) => {
      // evita duplicar un aviso idéntico que ya esté en pantalla
      if (prev.some((t) => t.status === status && t.title === title && t.message === message)) {
        return prev;
      }
      return [...prev, { id, status, title, message, duration: ms }].slice(-MAX_VISIBLE);
    });
    timers.current.set(id, setTimeout(() => dismiss(id), ms));
  }, [dismiss]);

  const showSuccess = useCallback((t, m, d) => push("success", t, m, d), [push]);
  const showError = useCallback((t, m, d) => push("error", t, m, d), [push]);
  const showWarning = useCallback((t, m, d) => push("warning", t, m, d), [push]);
  const showInfo = useCallback((t, m, d) => push("info", t, m, d), [push]);

  const clearNotification = useCallback(() => {
    timers.current.forEach((tm) => clearTimeout(tm));
    timers.current.clear();
    setToasts([]);
  }, []);

  // limpia todos los timers al desmontar
  useEffect(() => () => {
    timers.current.forEach((tm) => clearTimeout(tm));
    timers.current.clear();
  }, []);

  const value = { showSuccess, showError, showWarning, showInfo, clearNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Notification toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
};
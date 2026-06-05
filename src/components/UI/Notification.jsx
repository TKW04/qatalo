import "./Notification.css";

const getIcon = (type) => {
  switch (type) {
    case "success":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    case "error":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
        </svg>
      );
    case "warning":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
      );
    case "info":
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      );
  }
};

// errores/avisos interrumpen (assertive); el resto, polite
const roleFor = (type) => (type === "error" || type === "warning" ? "alert" : "status");

const Notification = ({ toasts = [], onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="notification-container">
      {toasts.map((t) => {
        const role = roleFor(t.status);
        return (
          <div
            key={t.id}
            className={`notification notification-${t.status} ${t.leaving ? "removing" : ""}`}
            role={role}
            aria-live={role === "alert" ? "assertive" : "polite"}
          >
            <div className="notification-content">
              <div className="notification-icon">{getIcon(t.status)}</div>
              <div className="notification-text">
                {t.title && <div className="notification-title">{t.title}</div>}
                {t.message && <div className="notification-message">{t.message}</div>}
              </div>
              <button
                className="notification-close"
                onClick={() => onDismiss(t.id)}
                aria-label="Cerrar notificación"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="notification-progress">
              <div
                className="notification-progress-bar"
                style={{ animationDuration: `${t.duration}ms` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Notification;
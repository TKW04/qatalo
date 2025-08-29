import { useState, useEffect, useRef } from "react"
import "./Notification.css"

const Notification = ({ status, title, message, onClose }) => {
  const [notifications, setNotifications] = useState([])
  const nextIdRef = useRef(1)
  const timeoutRefs = useRef(new Map())

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))

    // Limpiar el timeout si existe
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id))
      timeoutRefs.current.delete(id)
    }
  }

  const addNotification = (type, title, message) => {
    const id = nextIdRef.current
    nextIdRef.current += 1

    const newNotification = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
    }

    setNotifications((prev) => {
      const updated = [...prev, newNotification]
      return updated
    })

    // Auto remove after 4.5 seconds
    const timeoutId = setTimeout(() => {
      removeNotification(id)
      onClose()
    }, 4500)

    timeoutRefs.current.set(id, timeoutId)
  }

  // Limpiar timeouts al desmontar el componente
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => {
        clearTimeout(timeoutId)
      })
      timeoutRefs.current.clear()
    }
  }, [])

  // Manejar cambios de status - ESTE ES EL EFECTO CLAVE
  useEffect(() => {
    if (!status || !title) {
      return
    }

    // Solo evitar duplicados si hay una notificación activa del mismo tipo, título y mensaje
    const existingNotification = notifications.find(
      (notification) =>
        notification.type === status && notification.title === title && notification.message === message,
    )

    // Si ya existe una notificación idéntica activa, no agregar otra
    if (existingNotification) {
      return
    }

    switch (status) {
      case "pending":
      case "info":
        addNotification("info", title, message)
        break
      case "success":
        addNotification("success", title, message)
        break
      case "warning":
        // Clear existing warnings first
        setNotifications((prev) => {
          const filtered = prev.filter((notification) => notification.type !== "warning")
          // Limpiar timeouts de warnings eliminadas
          prev.forEach((notification) => {
            if (notification.type === "warning" && timeoutRefs.current.has(notification.id)) {
              clearTimeout(timeoutRefs.current.get(notification.id))
              timeoutRefs.current.delete(notification.id)
            }
          })
          return filtered
        })
        addNotification("warning", title, message)
        break
      case "error":
        addNotification("error", title, message)
        break
      default:
        console.log("❓ Unknown status:", status) // Debug log
        break
    }
  }, [status, title, message]) // Removí 'notifications' de las dependencias para evitar loops

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )
      case "error":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
          </svg>
        )
      case "warning":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        )
      case "info":
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        )
    }
  }

  const handleClose = (id) => {
    removeNotification(id)
    if (onClose) {
      onClose()
    }
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => {
        return (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            role="alert"
            aria-live="polite"
          >
            <div className="notification-content">
              <div className="notification-icon">{getIcon(notification.type)}</div>
              <div className="notification-text">
                {notification.title && <div className="notification-title">{notification.title}</div>}
                {notification.message && <div className="notification-message">{notification.message}</div>}
              </div>
              <button
                className="notification-close"
                onClick={() => handleClose(notification.id)}
                aria-label="Cerrar notificación"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="notification-progress">
              <div className="notification-progress-bar"></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Notification

"use client"

import "./Loading.css"

const Loading = ({ visible = true, message = "Cargando..." }) => {
  if (!visible) return null

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  )
}

export default Loading

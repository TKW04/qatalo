"use client";

import "./Loading.css";

const Loading = ({ visible = true, message = "Cargando..." }) => {
  if (!visible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-content">
          <div className="logo-container">
            <img
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
              alt="Qatalo"
              className="logo"
            />
            <div className="pulse-ring"></div>
          </div>

          <div className="loading-text">
            <h2>{message}</h2>
            <p>Preparando tu experiencia</p>
          </div>

          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;

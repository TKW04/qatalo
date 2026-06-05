import "./Loading.css";

const Loading = ({
  visible = true,
  message = "Cargando...",
  subMessage = "Preparando tu experiencia",
}) => {
  if (!visible) return null;

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-container">
        <div className="loading-content">
          <div className="logo-container" aria-hidden="true">
            <img
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
              alt=""
              className="logo"
            />
            <div className="pulse-ring"></div>
          </div>

          <div className="loading-text">
            <h2>{message}</h2>
            {subMessage && <p>{subMessage}</p>}
          </div>

          <div className="progress-bar" aria-hidden="true">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
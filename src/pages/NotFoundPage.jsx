import "./NotFoundPage.css";

const NotFoundPage = ({
  code    = "404",
  title   = "¡Oops! Página no encontrada",
  message = "La página que buscas parece haber tomado unas vacaciones. Pero no te preocupes, tenemos muchas otras cosas increíbles esperándote.",
  showHome = true,
  showBack = true,
  homeLabel = "Ir al inicio",
  backLabel = "Volver atrás",
  onHome = () => { window.location.href = "/"; },
  onBack = () => { window.history.back(); },
}) => (
  <div className="container-404">
    <div className="floating-shapes-404">
      <div className="shape-404-404 shape-404-1" />
      <div className="shape-404-404 shape-404-2" />
      <div className="shape-404-404 shape-404-3" />
      <div className="shape-404-404 shape-404-4" />
    </div>

    <div className="content-404">
      <div className="logo-404">Qatalo.online</div>
      <div className="error-code-404">{code}</div>
      <h1 className="error-title-404">{title}</h1>
      <p className="error-message-404">{message}</p>

      <div className="buttons-404">
        {showHome && (
          <button className="btn-404 btn-404-primary" onClick={onHome}>
            {homeLabel}
          </button>
        )}
        {showBack && (
          <button className="btn-404 btn-404-secondary" onClick={onBack}>
            {backLabel}
          </button>
        )}
      </div>
    </div>
  </div>
);

export default NotFoundPage;
import "./NotFoundPage.css";

const NotFoundPage = () => {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <>
      <div className="container-404 ">
        <div className="floating-shapes-404 ">
          <div className="shape-404-404 shape-404-1"></div>
          <div className="shape-404-404 shape-404-2"></div>
          <div className="shape-404-404 shape-404-3"></div>
          <div className="shape-404-404 shape-404-4"></div>
        </div>

        <div className="content-404">
          <div className="logo-404">Qatalo.online</div>

          <div className="error-code-404">404</div>

          <h1 className="error-title-404">¡Oops! Página no encontrada</h1>

          <p className="error-message-404 ">
            La página que buscas parece haber tomado unas vacaciones. Pero no te
            preocupes, tenemos muchas otras cosas increíbles esperándote.
          </p>

          <div className="buttons-404">
            <button className="btn-404 btn-404-primary" onClick={handleGoHome}>
              Ir al inicio
            </button>
            <button className="btn-404 btn-404-secondary" onClick={handleGoBack}>
              Volver atrás
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;

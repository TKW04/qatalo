const QrTab = ({ business, isDemo }) => {
  return (
    <div>
      <div className="admin-header">
        <h1>Código QR</h1>
        <p>Genera y descarga el código QR de tu catálogo</p>
      </div>

      <div className="admin-card">
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "2rem", color: "#666" }}>
            Comparte este código QR para que tus clientes accedan a tu catálogo
          </p>
          <div className="form-actions">
            <a
              href={
                isDemo
                  ? `/demo/admin/qr`
                  : `/admin/qr/${business.slug}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Ver QR del Catálogo
            </a>
            <a
              href={
                isDemo
                  ? `/demo/catalog/${business.slug}`
                  : `/catalog/${business.slug}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Ver Catálogo Público
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrTab;

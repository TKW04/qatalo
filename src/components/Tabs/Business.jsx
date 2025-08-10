import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Link } from "react-router-dom";

const Business = ({
  business,
  setBusiness,
  businessErrors,
  handleBusinessSubmit,
  isDemo,
}) => {
  return (
    <div>
      <div className="admin-header">
        <h1>Configuración del Negocio</h1>
        <p>Configura la información básica de tu negocio</p>
      </div>

      <div className="admin-card">
        <h2>Información General</h2>
        <form onSubmit={handleBusinessSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre del negocio *</label>
              <InputText
                value={business.name}
                className={`input ${businessErrors.name ? "error" : ""}`}
                placeholder="Mi Tienda"
                onChange={(e) =>
                  setBusiness({ ...business, name: e.target.value })
                }
              />
              {businessErrors.name && (
                <div className="error-message">{businessErrors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Slug (URL) *</label>
              <InputText
                value={business.slug}
                className={`input ${businessErrors.slug ? "error" : ""}`}
                placeholder="mi-tienda"
                onChange={(e) =>
                  setBusiness({ ...business, slug: e.target.value })
                }
              />
              {businessErrors.slug && (
                <div className="error-message">{businessErrors.slug}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Teléfono (WhatsApp) *</label>
              <InputText
                className={`input ${businessErrors.phone ? "error" : ""}`}
                value={business.phone}
                onChange={(e) => {
                  if (!isNaN(e.target.value)) {
                    setBusiness({ ...business, phone: e.target.value });
                  }
                }}
                placeholder="18095551234"
              />
              {businessErrors.phone && (
                <div className="error-message">{businessErrors.phone}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">URL del Logo</label>
              <InputText
                className={`input ${businessErrors.logoUrl ? "error" : ""}`}
                value={business.logoUrl}
                onChange={(e) =>
                  setBusiness({ ...business, logoUrl: e.target.value })
                }
                placeholder="https://ejemplo.com/logo.jpg"
              />
              {businessErrors.logoUrl && (
                <div className="error-message">{businessErrors.logoUrl}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <InputText
              className="input"
              value={business.description}
              onChange={(e) =>
                setBusiness({ ...business, description: e.target.value })
              }
              placeholder="Productos artesanales hechos a mano"
            />
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              label="Guardar Configuración"
              className="btn btn-primary"
            />
            <Link
              to={isDemo?`/demo/catalog/${business.slug}`:`/catalog/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Ver Catálogo Público
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Business;

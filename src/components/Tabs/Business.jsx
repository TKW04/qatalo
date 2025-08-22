import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { businessActions } from "../../store/business-store/business-slice";

const Business = ({
  business,
  setBusiness,
  businessErrors,
  handleBusinessSubmit,
  isDemo,
}) => {
  const dispatch = useDispatch();

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  };
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
                onChange={(e) => {
                  const slug = generateSlug(e.target.value);
                  if (isDemo) {
                    setBusiness({
                      ...business,
                      name: e.target.value,
                      slug: slug,
                    });
                  } else {
                    dispatch(
                      businessActions.modifyPropertyValue({
                        id: "name",
                        value: e.target.value,
                      })
                    );
                    dispatch(
                      businessActions.modifyPropertyValue({
                        id: "slug",
                        value: slug,
                      })
                    );
                  }
                }}
              />
              {businessErrors.name && (
                <div className="error-message">{businessErrors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Slug ({window.location.origin}/
                {isDemo ? "demo/catalog/" : "catalog/"}
                <span style={{ color: "red" }}>{business.slug}</span>) *
              </label>
              <InputText
                value={business.slug}
                className={`input ${businessErrors.slug ? "error" : ""}`}
                placeholder="mi-tienda"
                onChange={(e) => {
                  const slug = generateSlug(e.target.value);
                  if (isDemo) {
                    setBusiness({ ...business, slug: slug });
                  } else {
                    dispatch(
                      businessActions.modifyPropertyValue({
                        id: "slug",
                        value: slug,
                      })
                    );
                  }
                }}
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
                    if (isDemo) {
                      setBusiness({ ...business, phone: e.target.value });
                    } else {
                      dispatch(
                        businessActions.modifyPropertyValue({
                          id: "phone",
                          value: e.target.value,
                        })
                      );
                    }
                  }
                }}
                placeholder="18095551234"
              />
              {businessErrors.phone && (
                <div className="error-message">{businessErrors.phone}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Logo</label>
              <div className="card flex justify-content-center">
                <input
                  className={`input ${businessErrors.slug ? "error" : ""}`}
                  // className="fileUploadBasic"
                  accept="image/*"
                  type="file"
                  label="Seleccionar Imagen"
                  onChange={(e) => {
                    if (isDemo) {
                      const urlLogo = URL.createObjectURL(e.target.files[0]);
                      setBusiness({ ...business, logoUrl: urlLogo });
                    } else {
                      dispatch(
                        businessActions.modifyPropertyValue({
                          id: "logoUrl",
                          value: URL.createObjectURL(e.target.files[0]),
                        })
                      );
                      dispatch(
                        businessActions.modifyPropertyValue({
                          id: "logo",
                          value: e.target.files[0],
                        })
                      );
                    }
                  }}
                />
              </div>

              {businessErrors.logo && (
                <div className="error-message">{businessErrors.logo}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <InputText
              className="input"
              value={business.description}
              onChange={(e) => {
                if (isDemo) {
                  setBusiness({ ...business, description: e.target.value });
                } else {
                  dispatch(
                    businessActions.modifyPropertyValue({
                      id: "description",
                      value: e.target.value,
                    })
                  );
                }
              }}
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
              to={
                isDemo
                  ? `/demo/catalog/${business.slug}`
                  : `/catalog/${business.slug}`
              }
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

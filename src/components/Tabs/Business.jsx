import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

import { businessActions } from "../../store/business-store/business-slice";
import { useNotification } from "../UI/NotificationProvider";
import {
  CreateBusiness,
  GetBusiness,
  UpdateBusiness,
} from "../../store/business-store/business-actions";
import { getTokenInfo } from "../../helpers/token";
import Loading from "../UI/Loading";
let once = true;
const Business = () => {
  const auth = getTokenInfo();
  const business = useSelector((state) => state.business.business);
  const dispatch = useDispatch();
  const { showError, showWarning, showSuccess } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Cargando...");
  const [businessErrors, setBusinessErrors] = useState({});

  useEffect(() => {
    if (business !== null && business.business_id === "" && once) {
      dispatch(GetBusiness(auth.sub, showError));
      once = false;
      setTimeout(() => {
        setIsLoading(false);
      }, 4500);
    }
  }, [
    auth,
    business,
    dispatch,
    showError,
    showSuccess,
    showWarning,
  ]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  };
  const validateBusiness = (data) => {
    const errors = {};

    if (!data.name.trim()) errors.name = "El nombre es requerido";
    if (!data.slug.trim()) errors.slug = "El slug es requerido";
    else if (!/^[a-z0-9-]+$/.test(data.slug)) {
      errors.slug =
        "El slug solo puede contener letras minúsculas, números y guiones";
    }
    if (!data.phone.trim()) errors.phone = "El teléfono es requerido";

    return errors;
  };

  const handleBusinessSubmit = (e) => {
    e.preventDefault();
    const errors = validateBusiness(business);
    setBusinessErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      if (business.business_id === "") {
        setLoadingMessage("Creando negocio...");
        dispatch(CreateBusiness(business, showError, showWarning, showSuccess));
      } else {
        setLoadingMessage("Actualizando negocio...");
        dispatch(UpdateBusiness(business, showError, showWarning, showSuccess));
      }
      dispatch(GetBusiness(auth.sub, showError));
      setTimeout(() => {
        setIsLoading(false);
      }, 4500);
    }
  };
  
  return (
    <>
      <Loading message={loadingMessage} visible={isLoading} />
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
                  }}
                />
                {businessErrors.name && (
                  <div className="error-message">{businessErrors.name}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Slug ({window.location.origin}/catalog/
                  <span style={{ color: "red" }}>{business.slug}</span>) *
                </label>
                <InputText
                  value={business.slug}
                  className={`input ${businessErrors.slug ? "error" : ""}`}
                  placeholder="mi-tienda"
                  onChange={(e) => {
                    const slug = generateSlug(e.target.value);
                    dispatch(
                      businessActions.modifyPropertyValue({
                        id: "slug",
                        value: slug,
                      })
                    );
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
                      dispatch(
                        businessActions.modifyPropertyValue({
                          id: "phone",
                          value: e.target.value,
                        })
                      );
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
                    accept="image/*"
                    type="file"
                    label="Seleccionar Imagen"
                    onChange={(e) => {
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
                  dispatch(
                    businessActions.modifyPropertyValue({
                      id: "description",
                      value: e.target.value,
                    })
                  );
                }}
                placeholder="Productos artesanales hechos a mano"
              />
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                label="Guardar Configuración"
                className="btn btn-primary"
                disabled={isLoading}
              />
              <Link
                to={`/catalog/${business.slug}`}
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
    </>
  );
};
export default Business;

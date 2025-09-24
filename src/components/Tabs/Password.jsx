import { useState } from "react";
import Loading from "../UI/Loading";
import { getTokenInfo } from "../../helpers/token";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { useNotification } from "../UI/NotificationProvider";
import { logout } from "../../services/authenticate";
import { useDispatch } from "react-redux";
import { Forgot_Password } from "../../store/user-store/user-actions";

const Password = () => {
  const auth = getTokenInfo();
  const dispatch = useDispatch();
  const { showWarning, showError, showSuccess } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Cargando...");
  const isMobile = window.innerWidth <= 480;

  const maskaredEmail = (email) => {
    const [localPart, domain] = email.split("@");
    const maskedLocal = localPart
      .split("")
      .map((char, index) => (index < 2 ? char : "*"))
      .join("");
    return `${maskedLocal}@${domain}`;
  }

  return (
    <div>
      <Loading message={loadingMessage} visible={isLoading} />
      <div className="admin-header">
        <h1>Solicitar Cambio de Contraseña</h1>
      </div>
      <div className="card">
        <Card style={{ width: "100%", padding: "20px" }}>
          <>
            <div className="grid">
              <div className={`${isMobile ? "col-12" : "col-4"}`}>
                <span style={{ fontWeight: "bold" }}>Email: </span>
                <span style={{ color: "var(--color-navy)" }}>{maskaredEmail(auth.email)}</span>
              </div>

              <div className="col-12">
                <p>
                  Recibirás un correo electrónico para confirmar el cambio de
                  contraseña.
                </p>
              </div>
              <div className={`${isMobile ? "col-12" : "col-4"}`}>
                <Button
                  type="button"
                  className="btn btn-outline"
                  label="Solicitar"
                  onClick={() => {
                    setIsLoading(true);
                    setLoadingMessage("Enviando correo...");
                    dispatch(
                      Forgot_Password(
                        auth.email,
                        showError,
                        showWarning,
                        showSuccess
                      )
                    );
                    setTimeout(() => {
                      setIsLoading(false);
                      setLoadingMessage("");
                      logout();
                    }, 4500);
                  }}
                />
              </div>
            </div>
          </>
        </Card>
      </div>
    </div>
  );
};

export default Password;

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ban, Check } from "lucide-react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Image } from "primereact/image";
import { useNotification } from "../../components/UI/NotificationProvider";
import { userActions } from "../../store/user-store/user-slice";
import { CreateAccount } from "../../store/user-store/user-actions";
import { validatePassword } from "../../helpers/passwordValidator";
import "./Register.css";

const ForgotPassword = () => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const { showWarning, showError, showSuccess } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [showConfirmPasswordInfo, setShowConfirmPasswordInfo] = useState(false);
  const [isValidPassword, setIsValidPassword] = useState({
    isValid: false,
    errors: {
      number: false,
      specialChar: false,
      upperCase: false,
      lowerCase: false,
    },
  });
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);

  const [isRegisterActive, setIsRegisterActive] = useState(true);
  const [isForgotActive, setIsForgotActive] = useState(false);

  const showForm = (formId) => {
    if (formId === "register") {
      setIsRegisterActive(true);
      setIsForgotActive(false);
    } else if (formId === "forgot") {
      setIsRegisterActive(false);
      setIsForgotActive(true);
    }
  };
  const onChange = (id, value) => {
    if (id === "password") {
      const passwordValidation = validatePassword(value);
      setIsValidPassword(passwordValidation);
    } else if (id === "confirmPassword") {
      if (user.password === value) {
        setIsConfirmPasswordValid(true);
      } else {
        setIsConfirmPasswordValid(false);
      }
      dispatch(userActions.modifyPropertyValue({ id, value: value }));
    }
    dispatch(userActions.modifyPropertyValue({ id, value: value }));
  };

  const handleRegister = (event) => {
    event.preventDefault();
    if (user.password !== user.confirmPassword) {
      showWarning(
        "Contraseñas no coinciden",
        "Por favor, verifica tu contraseña"
      );
      return;
    }
    if (!isValidPassword.isValid) {
      showWarning(
        "Contraseña no válida",
        "La contraseña debe contener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial."
      );
      return;
    }

    dispatch(CreateAccount(user, showError, showWarning, showSuccess));
  };

  return (
    <>
      <div className="auth-container">
        <div
          id="register"
          className={`form-section ${isRegisterActive ? "active" : ""}`}
        >
          <div className="logo">
            <Image
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
              alt="CatalogQR Logo"
              width={200}
              style={{ padding: "0rem" }}
            />
            <h1>Crear Cuenta</h1>
            <p>Únete a nuestra comunidad</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="register-name">Nombre</label>
              <InputText
                id="register-name"
                value={user.given_name}
                onChange={(e) => onChange("given_name", e.target.value)}
                required
                onFocus={() => {
                  setShowPasswordInfo(false);
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-family_name">Apellido</label>
              <InputText
                id="register-family_name"
                value={user.family_name}
                onChange={(e) => onChange("family_name", e.target.value)}
                required
                onFocus={() => {
                  setShowPasswordInfo(false);
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email">Correo Electrónico</label>
              <InputText
                id="register-email"
                value={user.email}
                onChange={(e) => onChange("email", e.target.value)}
                required
                onFocus={() => {
                  setShowPasswordInfo(false);
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">Contraseña</label>
              <InputText
                id="register-password"
                type="password"
                value={user.password}
                onChange={(e) => onChange("password", e.target.value)}
                required
                minLength="8"
                onFocus={() => {
                  setShowPasswordInfo(true);
                }}
              />
              {showPasswordInfo && (
                <div
                  className="password-requirements"
                  style={{ marginTop: "0.5rem" }}
                >
                  <div
                    style={{
                      color: isValidPassword.errors.upperCase ? "green" : "red",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {isValidPassword.errors.upperCase ? <Check /> : <Ban />}
                      Debe contener al menos una letra mayúscula
                    </span>
                  </div>
                  <div
                    style={{
                      color: isValidPassword.errors.lowerCase ? "green" : "red",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {isValidPassword.errors.lowerCase ? <Check /> : <Ban />}
                      Debe contener al menos una letra minúscula
                    </span>
                  </div>
                  <div
                    style={{
                      color: isValidPassword.errors.number ? "green" : "red",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {isValidPassword.errors.number ? <Check /> : <Ban />}
                      Debe contener al menos un número
                    </span>
                  </div>
                  <div
                    style={{
                      color: isValidPassword.errors.specialChar
                        ? "green"
                        : "red",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {isValidPassword.errors.specialChar ? <Check /> : <Ban />}
                      Debe contener al menos un carácter especial
                    </span>
                  </div>
                  <div
                    style={{
                      color: isValidPassword.errors.minLength ? "green" : "red",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {isValidPassword.errors.minLength ? <Check /> : <Ban />}
                      Debe contener al menos 8 caracteres
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="register-confirm">Confirmar Contraseña</label>
              <InputText
                id="register-confirm"
                type="password"
                value={user.confirmPassword}
                onChange={(e) => onChange("confirmPassword", e.target.value)}
                required
                minLength="8"
                onFocus={() => setShowConfirmPasswordInfo(true)}
              />
              {showConfirmPasswordInfo && (
                <div
                  className="password-requirements"
                  style={{ marginTop: "0.5rem" }}
                >
                  <div
                    style={{
                      color: isConfirmPasswordValid ? "green" : "red",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>
                      {isConfirmPasswordValid ? <Check /> : <Ban />}
                      {isConfirmPasswordValid
                        ? "Las contraseñas coinciden"
                        : "Las contraseñas no coinciden"}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <Button
              type="submit"
              label="Crear Cuenta"
              className={`btn  ${
                !isValidPassword.isValid || !isConfirmPasswordValid
                  ? "btn-disabled"
                  : "btn-primary"
              }`}
              disabled={!isValidPassword.isValid || !isConfirmPasswordValid}
            />
          </form>

          <button
            className="btn btn-secondary"
            onClick={() => (window.location.href = "/login")}
          >
            Ya tengo una cuenta
          </button>
          <button
            className="btn btn-danger"
            onClick={() => (window.location.href = "/")}
          >
            Cancelar
          </button>
        </div>

        <div
          id="forgot"
          className={`form-section ${isForgotActive ? "active" : ""}`}
        >
          <div className="logo">
            <h1>Recuperar Contraseña</h1>
            <p>Te enviaremos un enlace de recuperación</p>
          </div>

          <div id="forgot-form">
            <form onsubmit="handleForgot(event)">
              <div class="form-group">
                <label for="forgot-email">Correo Electrónico</label>
                <input type="email" id="forgot-email" required />
              </div>

              <button type="submit" class="btn btn-primary">
                Enviar Enlace
              </button>
            </form>
          </div>

          <div id="forgot-success" style={{ display: "none" }}>
            <div className="success-message">
              ✓ Enlace de recuperación enviado correctamente
            </div>
            <p
              style={{
                textAlign: "center",
                color: "var(--blue-medium)",
                marginBottom: "20px",
              }}
            >
              Revisa tu bandeja de entrada y sigue las instrucciones del correo.
            </p>
          </div>

          <div className="divider">
            <span>o</span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => showForm("login")}
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </>
  );
};
export default ForgotPassword;

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useNotification } from "../../components/UI/NotificationProvider";
import { userActions } from "../../store/user-store/user-slice";
import { Forgot_Password } from "../../store/user-store/user-actions";
import Loading from "../../components/UI/Loading";

import PrimaryButton from "../../components/PrimaryButton";
import styles from "./Auth.module.css"; // Usamos el MISMO css del Login

const ForgotPassword = () => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const { showWarning, showError, showSuccess } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Cargando...");
  const [isValidEmail, setIsValidEmail] = useState(false);

  const onChange = (id, value) => {
    dispatch(userActions.modifyPropertyValue({ id, value: value }));
  };

  const handleForgot = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setLoadingMessage("Enviando correo...");

    dispatch(Forgot_Password(user.email, showError, showWarning, showSuccess));

    setTimeout(() => {
      setIsLoading(false);
      setLoadingMessage("");
      window.location.href = "/login";
    }, 4500);
  };

  return (
    <>
      {isLoading && <Loading message={loadingMessage} />}

      <div className={styles.pageWrapper}>
        <div className={styles.authContainer}>
          <div className={styles.logo}>
            <img
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
              alt="Qatalo Logo"
              loading="lazy"
            />
            <h1>¿Olvidaste tu Contraseña?</h1>
            <p style={{ textAlign: "center", color: "var(--color-blue)", marginBottom: "1.5rem" }}>
              Ingresa tu correo y te enviaremos las instrucciones
            </p>
          </div>

          <form onSubmit={handleForgot}>
            <div className={styles.formGroup}>
              <label htmlFor="forgot-email">Correo Electrónico</label>
              <input
                type="email"
                id="forgot-email"
                className={styles.input}
                value={user.email || ""}
                onChange={(e) => {
                  setIsValidEmail(e.target.value.length > 0);
                  onChange("email", e.target.value);
                }}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.actions}>
              {/* Gracias a nuestra actualización, este botón se pondrá gris si isValidEmail es falso */}
              <PrimaryButton
                type="submit"
                variant="primary"
                disabled={!isValidEmail}
              >
                Enviar enlace
              </PrimaryButton>

              <PrimaryButton to="/login" variant="danger">
                Cancelar
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
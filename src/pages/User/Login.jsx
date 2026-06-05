import { useState } from "react";
import { Link } from "react-router-dom";

import { authenticate } from "../../services/authenticate";
import userpoolMerchants from "../../services/userpoolMerchants";
import { getTokenInfo, setToken } from "../../helpers/token";
import Loading from "../../components/UI/Loading";
import { useNotification } from "../../components/UI/NotificationProvider";
import PrimaryButton from "../../components/PrimaryButton";
import styles from "./Auth.module.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { showWarning } = useNotification();

  const onChange = (id, value) => setForm((p) => ({ ...p, [id]: value }));

  const handleLogin = (event) => {
    event.preventDefault();
    setIsLoading(true);

    authenticate(form.email, form.password, userpoolMerchants)
      .then((data) => {
        setToken(data.idToken.jwtToken);
        const userInfo = getTokenInfo();
        if (userInfo && userInfo["custom:transaction_status"] === "pending") {
          window.location.href = "/payment";
        } else {
          window.location.href = "/admin";
        }
      })
      .catch(() => {
        showWarning("No autorizado", "Usuario o contraseña incorrectos");
        setIsLoading(false);
      });
  };

  if (isLoading) return <Loading message="Iniciando sesión..." />;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.authContainer}>
        <div className={styles.logo}>
          <img
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
            alt="Qatalo Logo"
            loading="lazy"
          />
          <h1>Bienvenido</h1>
        </div>

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label htmlFor="login-email">Correo Electrónico</label>
            <input
              type="email"
              id="login-email"
              className={styles.input}
              required
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="login-password">Contraseña</label>
            <input
              type="password"
              id="login-password"
              className={styles.input}
              required
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className={styles.formLinks}>
            <Link to="/forgotpassword">¿Olvidaste tu contraseña?</Link>
          </div>

          <div className={styles.actions}>
            <PrimaryButton type="submit" variant="primary">
              Iniciar Sesión
            </PrimaryButton>

            <PrimaryButton to="/register" variant="secondary">
              Crear Nueva Cuenta
            </PrimaryButton>

            <PrimaryButton to="/" variant="danger">
              Cancelar
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
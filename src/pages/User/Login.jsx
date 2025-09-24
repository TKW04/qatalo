import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Image } from "primereact/image";

import { authenticate } from "../../services/authenticate";
import { getTokenInfo, setToken } from "../../helpers/token";
import { userActions } from "../../store/user-store/user-slice";
import Loading from "../../components/UI/Loading";
import { useNotification } from "../../components/UI/NotificationProvider";
import "./Login.css";

const Login = () => {
  const user = useSelector((state) => state.user.user);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { showWarning } = useNotification();

  const onChange = (id, value) => {
    dispatch(userActions.modifyPropertyValue({ id, value: value }));
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setIsLoading(true);

    authenticate(user.email, user.password)
      .then(
        (data) => {
          setToken(data.idToken.jwtToken);
          const userInfo = getTokenInfo();
          if (userInfo && userInfo["custom:transaction_status"] === "pending") {
            window.location.href = "/payment";
          } else {
            window.location.href = "/admin";
          }
        },
        () => {
          showWarning("No autorizado!", "Usuario o contraseña incorrectos");
          setIsLoading(false);
        }
      )
      .catch((err) => console.log(err));
  };

  return (
    <>
      <Loading message={"Iniciando sesión..."} visible={isLoading} />
      <div className="auth-container-login">
        <div id="login">
          <div className="logo_login">
            <Image
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
              alt="CatalogQR logo_login"
              width={200}
              style={{ padding: "0rem" }}
            />
            <h1>Bienvenido</h1>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Correo Electrónico</label>
              <InputText
                type="email"
                id="login-email"
                required
                value={user.email}
                onChange={(e) => onChange("email", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Contraseña</label>
              <InputText
                type="password"
                id="login-password"
                required
                value={user.password}
                onChange={(e) => onChange("password", e.target.value)}
              />
            </div>
            <div className="form-links">
              <a
                href="#"
                onClick={() => (window.location.href = "/forgot-password")}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button
              type="submit"
              className="btn btn-login-primary"
              label="Iniciar Sesión"
            />
          </form>

          <Button
            className="btn btn-login-secondary"
            onClick={() => (window.location.href = "/register")}
            label=" Crear Nueva Cuenta"
          />
          <Button
            className="btn btn-danger"
            onClick={() => (window.location.href = "/")}
            label="Cancelar"
          />
        </div>
      </div>
    </>
  );
};
export default Login;

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Image } from "primereact/image";
import { useNotification } from "../../components/UI/NotificationProvider";
import { userActions } from "../../store/user-store/user-slice";
import { Forgot_Password } from "../../store/user-store/user-actions";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const { showWarning, showError, showSuccess } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [isValidEmail, setIsValidEmail] = useState(false);

  const onChange = (id, value) => {
    dispatch(userActions.modifyPropertyValue({ id, value: value }));
  };

  const handleForgot = (event) => {
    event.preventDefault();
    dispatch(Forgot_Password(user.email, showError, showWarning, showSuccess));
  };

  return (
    <>
      <div className="auth-container-forgot">
        <div id="register" className={`form-section active`}>
          <div className="logo_forgot">
            <Image
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
              alt="CatalogQR logo_forgot"
              width={200}
              style={{ padding: "0rem" }}
            />
            <h1>Olvidaste tu Contraseña?</h1>
            
          </div>

          <form onSubmit={handleForgot}>
            <div className="form-group">
              <label htmlFor="register-email">Correo Electrónico</label>
              <InputText
                id="register-email"
                value={user.email}
                onChange={(e) => {
                  setIsValidEmail(true);
                  onChange("email", e.target.value);
                }}
                required
              />
            </div>
            <Button
              type="submit"
              label="Enviar enlance"
              className={`btn  ${
                !isValidEmail ? "btn-disabled" : "btn-primary"
              }`}
              disabled={!isValidEmail}
            />
          </form>
          <button
            className="btn btn-danger"
            onClick={() => (window.location.href = "/login")}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
};
export default ForgotPassword;

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Ban, Check } from "lucide-react";

import { useNotification } from "../../components/UI/NotificationProvider";
import { userActions } from "../../store/user-store/user-slice";
import { CreateAccount } from "../../store/user-store/user-actions";
import { validatePassword } from "../../helpers/passwordValidator";
import Loading from "../../components/UI/Loading";

import PrimaryButton from "../../components/PrimaryButton";
import styles from "./Auth.module.css";

const Register = () => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const { showWarning, showError, showSuccess } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [showConfirmPasswordInfo, setShowConfirmPasswordInfo] = useState(false);

  const [isValidPassword, setIsValidPassword] = useState({
    isValid: false,
    errors: {
      number: false,
      specialChar: false,
      upperCase: false,
      lowerCase: false,
      minLength: false, // Añadido para evitar errores si no estaba en el estado inicial
    },
  });

  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);

  const onChange = (id, value) => {
    if (id === "password") {
      const passwordValidation = validatePassword(value);
      setIsValidPassword(passwordValidation);
    } else if (id === "confirmPassword") {
      setIsConfirmPasswordValid(user.password === value);
    }
    dispatch(userActions.modifyPropertyValue({ id, value }));
  };

  const handleRegister = (event) => {
    event.preventDefault();
    if (user.password !== user.confirmPassword) {
      showWarning("Contraseñas no coinciden", "Por favor, verifica tu contraseña");
      return;
    }
    if (!isValidPassword.isValid) {
      showWarning(
        "Contraseña no válida",
        "La contraseña debe contener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial."
      );
      return;
    }

    setIsLoading(true);
    dispatch(CreateAccount(user, showError, showWarning, showSuccess));
    setTimeout(() => {
      window.location.href = "/login";
    }, 4500);
  };

  // Helper para renderizar los items de validación
  const ValidationItem = ({ isValid, text }) => (
    <span className={`${styles.validationItem} ${isValid ? styles.valid : styles.invalid}`}>
      {isValid ? <Check size={16} /> : <Ban size={16} />}
      {text}
    </span>
  );

  return (
    <>
      {isLoading && <Loading message="Creando cuenta..." />}

      {!isLoading && (
        <div className={styles.pageWrapper}>
          <div className={styles.authContainer}>
            <div className={styles.logo}>
              <img
                src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
                alt="Qatalo Logo"
                loading="lazy"
              />
              <h1>Crear Cuenta</h1>
              <p style={{ color: "var(--color-blue)" }}>Únete a nuestra plataforma</p>
            </div>

            <form onSubmit={handleRegister}>
              <div className={styles.formGroup}>
                <label htmlFor="register-name">Nombre</label>
                <input
                  type="text"
                  id="register-name"
                  className={styles.input}
                  value={user.given_name || ""}
                  onChange={(e) => onChange("given_name", e.target.value)}
                  required
                  onFocus={() => setShowPasswordInfo(false)}
                  autoComplete="given-name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="register-family_name">Apellido</label>
                <input
                  type="text"
                  id="register-family_name"
                  className={styles.input}
                  value={user.family_name || ""}
                  onChange={(e) => onChange("family_name", e.target.value)}
                  required
                  onFocus={() => setShowPasswordInfo(false)}
                  autoComplete="family-name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="register-email">Correo Electrónico</label>
                <input
                  type="email"
                  id="register-email"
                  className={styles.input}
                  value={user.email || ""}
                  onChange={(e) => onChange("email", e.target.value)}
                  required
                  onFocus={() => setShowPasswordInfo(false)}
                  autoComplete="email"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="register-password">Contraseña</label>
                <input
                  type="password"
                  id="register-password"
                  className={styles.input}
                  value={user.password || ""}
                  onChange={(e) => onChange("password", e.target.value)}
                  required
                  minLength="8"
                  onFocus={() => setShowPasswordInfo(true)}
                  autoComplete="new-password"
                />

                {showPasswordInfo && (
                  <div className={styles.validationBox}>
                    <ValidationItem isValid={isValidPassword.errors.upperCase} text="Al menos una mayúscula" />
                    <ValidationItem isValid={isValidPassword.errors.lowerCase} text="Al menos una minúscula" />
                    <ValidationItem isValid={isValidPassword.errors.number} text="Al menos un número" />
                    <ValidationItem isValid={isValidPassword.errors.specialChar} text="Al menos un carácter especial" />
                    <ValidationItem isValid={isValidPassword.errors.minLength} text="Mínimo 8 caracteres" />
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="register-confirm">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="register-confirm"
                  className={styles.input}
                  value={user.confirmPassword || ""}
                  onChange={(e) => onChange("confirmPassword", e.target.value)}
                  required
                  minLength="8"
                  onFocus={() => setShowConfirmPasswordInfo(true)}
                  autoComplete="new-password"
                />

                {showConfirmPasswordInfo && (
                  <div className={styles.validationBox}>
                    <ValidationItem
                      isValid={isConfirmPasswordValid}
                      text={isConfirmPasswordValid ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                    />
                  </div>
                )}
              </div>

              <div className={styles.actions} style={{ marginTop: "20px" }}>
                <PrimaryButton
                  type="submit"
                  variant="primary"
                  disabled={!isValidPassword.isValid || !isConfirmPasswordValid}
                >
                  Crear Cuenta
                </PrimaryButton>

                <PrimaryButton to="/login" variant="secondary">
                  Ya tengo una cuenta
                </PrimaryButton>

                <PrimaryButton to="/" variant="danger">
                  Cancelar
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Register;
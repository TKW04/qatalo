import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Ban, Check } from "lucide-react";

import { useNotification } from "../../components/UI/NotificationProvider";
import { createAccount } from "../../services/userApi";
import { validatePassword } from "../../helpers/passwordValidator";
import Loading from "../../components/UI/Loading";
import PrimaryButton from "../../components/PrimaryButton";
import styles from "./Auth.module.css";

const Register = () => {
  const navigate = useNavigate();
  const { showWarning, showSuccess } = useNotification();

  const [form, setForm] = useState({
    given_name: "",
    family_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [showConfirmPasswordInfo, setShowConfirmPasswordInfo] = useState(false);

  const validation = useMemo(() => validatePassword(form.password), [form.password]);
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const canSubmit = validation.isValid && passwordsMatch;

  const onChange = (id, value) => setForm((p) => ({ ...p, [id]: value }));

  const { mutate, isPending } = useMutation({
    mutationFn: () => createAccount(form),
    onSuccess: () => {
      showSuccess("Usuario creado", "Usuario creado con éxito");
      navigate("/login");
    },
    onError: () =>
      showWarning("No se pudo crear el usuario", "Valide los datos ingresados"),
  });

  const handleRegister = (event) => {
    event.preventDefault();
    if (!passwordsMatch) {
      showWarning("Contraseñas no coinciden", "Por favor, verifica tu contraseña");
      return;
    }
    if (!validation.isValid) {
      showWarning(
        "Contraseña no válida",
        "La contraseña debe contener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial."
      );
      return;
    }
    mutate();
  };

  const ValidationItem = ({ isValid, text }) => (
    <span className={`${styles.validationItem} ${isValid ? styles.valid : styles.invalid}`}>
      {isValid ? <Check size={16} /> : <Ban size={16} />}
      {text}
    </span>
  );

  if (isPending) return <Loading message="Creando cuenta..." />;

  return (
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
              value={form.given_name}
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
              value={form.family_name}
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
              value={form.email}
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
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              required
              minLength={8}
              onFocus={() => setShowPasswordInfo(true)}
              autoComplete="new-password"
            />

            {showPasswordInfo && (
              <div className={styles.validationBox}>
                <ValidationItem isValid={validation.errors.upperCase} text="Al menos una mayúscula" />
                <ValidationItem isValid={validation.errors.lowerCase} text="Al menos una minúscula" />
                <ValidationItem isValid={validation.errors.number} text="Al menos un número" />
                <ValidationItem isValid={validation.errors.specialChar} text="Al menos un carácter especial" />
                <ValidationItem isValid={validation.errors.minLength} text="Mínimo 8 caracteres" />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-confirm">Confirmar Contraseña</label>
            <input
              type="password"
              id="register-confirm"
              className={styles.input}
              value={form.confirmPassword}
              onChange={(e) => onChange("confirmPassword", e.target.value)}
              required
              minLength={8}
              onFocus={() => setShowConfirmPasswordInfo(true)}
              autoComplete="new-password"
            />

            {showConfirmPasswordInfo && (
              <div className={styles.validationBox}>
                <ValidationItem
                  isValid={passwordsMatch}
                  text={passwordsMatch ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                />
              </div>
            )}
          </div>

          <div className={styles.actions} style={{ marginTop: "20px" }}>
            <PrimaryButton type="submit" variant="primary" disabled={!canSubmit}>
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
  );
};

export default Register;
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Ban, Check } from "lucide-react";

import { useNotification } from "../../components/UI/NotificationProvider";
import Loading from "../../components/UI/Loading";
import { validatePassword } from "../../helpers/passwordValidator";
import { forgotPassword, resetPassword } from "../../services/userApi";
import styles from "./ResetPassword.module.css";

const ResetPassword = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { showWarning, showError, showSuccess } = useNotification();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwInfo, setShowPwInfo] = useState(false);
  const [showConfirmInfo, setShowConfirmInfo] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [email, setEmail] = useState("");

  const validation = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = validation.isValid && passwordsMatch;

  const { mutate, isPending } = useMutation({
    mutationFn: () => resetPassword(params.token, password),
    onSuccess: () => {
      showSuccess("¡Listo!", "Tu contraseña fue actualizada correctamente.");
      navigate("/login");
    },
    onError: (err) => {
      if (err?.code === "invalid_token") {
        setLinkInvalid(true);
        return;
      }
      if (err?.code === "invalid_password") {
        showWarning("Contraseña no válida", err.message);
        return;
      }
      showError(
        "Error",
        "No se pudo restablecer la contraseña. Inténtalo de nuevo en un momento."
      );
    },
  });

  const requestLink = useMutation({
    mutationFn: () => forgotPassword(email.trim()),
    onSuccess: () =>
      showSuccess(
        "Revisa tu correo",
        "Si el correo está registrado, recibirás un nuevo enlace (válido 60 minutos)."
      ),
    onError: () =>
      showWarning("No se pudo enviar", "Inténtalo de nuevo en un momento."),
  });

  const handleRequestLink = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    requestLink.mutate();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validation.isValid) {
      showWarning(
        "Contraseña no válida",
        "Debe tener 8+ caracteres, mayúscula, minúscula, número y carácter especial."
      );
      return;
    }
    if (!passwordsMatch) {
      showWarning("Contraseñas no coinciden", "Por favor, verifica tu contraseña.");
      return;
    }
    mutate();
  };

  const reqs = [
    { ok: validation.errors.upperCase, text: "Al menos una letra mayúscula" },
    { ok: validation.errors.lowerCase, text: "Al menos una letra minúscula" },
    { ok: validation.errors.number, text: "Al menos un número" },
    { ok: validation.errors.specialChar, text: "Al menos un carácter especial" },
    { ok: validation.errors.minLength, text: "Al menos 8 caracteres" },
  ];

  if (isPending) return <Loading message="Guardando..." />;

  if (linkInvalid) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <img
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
              alt="Qatalo"
              width={200}
            />
            <h1>Enlace inválido o caducado</h1>
            <p>
              Los enlaces de recuperación caducan a los 60 minutos y solo se
              pueden usar una vez. Solicita uno nuevo.
            </p>
          </div>

          <form onSubmit={handleRequestLink}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className={`${styles.btn} ${
                email.trim() && !requestLink.isPending
                  ? styles.btnPrimary
                  : styles.btnDisabled
              }`}
              disabled={!email.trim() || requestLink.isPending}
            >
              {requestLink.isPending ? "Enviando..." : "Enviar nuevo enlace"}
            </button>
          </form>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={() => navigate("/login")}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
            alt="Qatalo"
            width={200}
          />
          <h1>Restablecer contraseña</h1>
          <p>Crea tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowPwInfo(true)}
              required
              minLength={8}
            />
            {showPwInfo && (
              <div className={styles.requirements}>
                {reqs.map((r, i) => (
                  <div key={i} className={r.ok ? styles.reqOk : styles.reqBad}>
                    {r.ok ? <Check size={16} /> : <Ban size={16} />}
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirm">Confirmar contraseña</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setShowConfirmInfo(true)}
              required
              minLength={8}
            />
            {showConfirmInfo && (
              <div className={styles.requirements}>
                <div className={passwordsMatch ? styles.reqOk : styles.reqBad}>
                  {passwordsMatch ? <Check size={16} /> : <Ban size={16} />}
                  <span>
                    {passwordsMatch
                      ? "Las contraseñas coinciden"
                      : "Las contraseñas no coinciden"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`${styles.btn} ${canSubmit ? styles.btnPrimary : styles.btnDisabled}`}
            disabled={!canSubmit}
          >
            Guardar
          </button>
        </form>

        <button
          type="button"
          className={`${styles.btn} ${styles.btnDanger}`}
          onClick={() => navigate("/login")}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
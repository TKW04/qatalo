import { useMutation } from "@tanstack/react-query";

import { getTokenInfo } from "../../../helpers/token";
import { useNotification } from "../../../components/UI/NotificationProvider";
import Loading from "../../../components/UI/Loading";
import { logout } from "../../../services/authenticate";
import { forgotPassword } from "../../../services/userApi";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./Password.module.css";

const maskEmail = (email = "") => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local.split("").map((c, i) => (i < 2 ? c : "*")).join("");
  return `${masked}@${domain}`;
};

const Password = () => {
  const auth = getTokenInfo();
  const { showWarning, showSuccess } = useNotification();

  const request = useMutation({
    mutationFn: () => forgotPassword(auth.email),
    onSuccess: () => {
      showSuccess(
        "Correo enviado",
        "Revisa tu bandeja para continuar con el cambio de contraseña."
      );
      // pequeña pausa para que se vea el aviso y luego cerramos sesión
      setTimeout(logout, 1500);
    },
    onError: () => showWarning("No se pudo enviar", "Inténtalo de nuevo en un momento."),
  });

  if (request.isPending) return <Loading message="Enviando correo..." />;

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Cambiar contraseña</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Correo</span>
          <span className={styles.value}>{maskEmail(auth?.email)}</span>
        </div>

        <p className={styles.note}>
          Te enviaremos un correo a tu dirección registrada para confirmar el cambio de
          contraseña. Por seguridad, se cerrará tu sesión al solicitarlo.
        </p>

        <button
          className={styles.btn}
          disabled={request.isPending}
          onClick={() => request.mutate()}
        >
          {request.isPending ? "Enviando..." : "Solicitar cambio de contraseña"}
        </button>
      </div>
    </div>
  );
};

export default Password;
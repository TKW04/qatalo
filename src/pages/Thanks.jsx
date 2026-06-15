import { useEffect, useState } from "react";
import { CognitoUserPool } from "amazon-cognito-identity-js";
import styles from "./Thanks.module.css";

// ── Refresca el token para obtener los custom:attributes actualizados por Paddle ──
const refreshCognitoToken = () =>
  new Promise(resolve => {
    try {
      const pool = new CognitoUserPool({
        UserPoolId: import.meta.env.VITE_APP_USER_POOL_ID,   // ← ajusta el nombre de tu env var
        ClientId: import.meta.env.VITE_APP_CLIENT_ID,      // ← ajusta el nombre de tu env var
      });
      const user = pool.getCurrentUser();
      if (!user) { resolve(); return; }
      user.getSession((err, session) => {
        if (err || !session) { resolve(); return; }
        user.refreshSession(session.getRefreshToken(), () => resolve());
      });
    } catch {
      resolve(); // falla silenciosamente — el usuario igual puede continuar
    }
  });

const STEPS = [
  { key: "payment", label: "Pago procesado" },
  { key: "activating", label: "Activando suscripción" },
  { key: "redirect", label: "Preparando tu panel" },
];

const Thanks = () => {
  const [activeStep, setActiveStep] = useState(0); // 0 = payment, 1 = activating, 2 = redirect
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    // Paso 1 — completado inmediatamente (pago ya confirmado)
    const t1 = setTimeout(() => setActiveStep(1), 800);

    // Countdown visual
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    // Paso 3 — después de 4 s: refrescar token y redirigir
    const t2 = setTimeout(async () => {
      clearInterval(interval);
      setActiveStep(2);
      await refreshCognitoToken();
      // Hard redirect: el app lee el token fresco desde localStorage
      window.location.href = "/admin";
    }, 4000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(interval); };
  }, []);

  const goNow = async () => {
    await refreshCognitoToken();
    window.location.href = "/admin";
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Checkmark animado */}
        <div className={styles.iconWrap}>
          <svg className={styles.check} viewBox="0 0 52 52" aria-hidden="true">
            <circle className={styles.circle} cx="26" cy="26" r="24" fill="none" />
            <path className={styles.tick} fill="none" d="M14 27l8 8 16-16" />
          </svg>
        </div>

        <h1 className={styles.title}>¡Gracias por tu compra!</h1>
        <p className={styles.message}>
          Tu pago se procesó correctamente. Estamos activando tu cuenta.
        </p>

        {/* Steps */}
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`${styles.step} ${i < activeStep ? styles.stepDone : ""} ${i === activeStep ? styles.stepActive : ""}`}
            >
              <span className={styles.stepDot}>
                {i < activeStep ? "✓" : i === activeStep && s.key === "redirect" ? countdown : i === activeStep ? "⋯" : ""}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Saltar espera */}
        {activeStep < 2 && (
          <button className={styles.skipBtn} onClick={goNow}>
            Ir al panel ahora →
          </button>
        )}
      </div>
    </div>
  );
};

export default Thanks;
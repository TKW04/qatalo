import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { requestAccessCode, verifyAccessCode } from "../../services/customerAuthApi";
import styles from "./CustomerPortal.module.css";

const CustomerAuthModal = ({ businessId, businessName, onClose, onSuccess }) => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const reqM = useMutation({
    mutationFn: () => requestAccessCode(businessId, email.trim()),
    onSuccess: () => { setError(""); setStep("code"); },
    onError: () => setError("No se pudo enviar el código. Intenta de nuevo."),
  });

  const verM = useMutation({
    mutationFn: () => verifyAccessCode(businessId, email.trim(), code.trim()),
    onSuccess: (data) => onSuccess(data.customer),
    onError: () => setError("Código inválido o expirado."),
  });

  const submitEmail = (e) => { e.preventDefault(); if (email.trim()) reqM.mutate(); };
  const submitCode = (e) => { e.preventDefault(); if (code.trim().length >= 4) verM.mutate(); };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Cerrar">×</button>
        <h2 className={styles.title}>Mis órdenes</h2>

        {step === "email" ? (
          <form onSubmit={submitEmail}>
            <p className={styles.lead}>
              Ingresa el correo con el que compraste en {businessName || "esta tienda"} y te enviaremos un código de acceso.
            </p>
            <label className={styles.label}>Correo electrónico</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              autoFocus
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.primaryBtn} disabled={reqM.isPending}>
              {reqM.isPending ? "Enviando..." : "Enviarme un código"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode}>
            <p className={styles.lead}>
              Te enviamos un código de 6 dígitos a <strong>{email}</strong>. Vence en 10 minutos.
            </p>
            <label className={styles.label}>Código</label>
            <input
              className={`${styles.input} ${styles.codeInput}`}
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.primaryBtn} disabled={verM.isPending}>
              {verM.isPending ? "Verificando..." : "Ingresar"}
            </button>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => { setCode(""); setError(""); reqM.mutate(); }}
              disabled={reqM.isPending}
            >
              {reqM.isPending ? "Reenviando..." : "Reenviar código"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerAuthModal;
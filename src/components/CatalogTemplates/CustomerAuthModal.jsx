import { useId, useState } from "react";
import { X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { requestAccessCode, verifyAccessCode } from "../../services/customerAuthApi";
import styles from "./CustomerPortal.module.css";
import useDialog from "./useDialog";

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

  const dialogRef = useDialog(onClose);
  const titleId = useId();
  const fid = useId();

  return (
    <div className={styles.overlay} onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
        <h2 className={styles.title} id={titleId}>Mis órdenes</h2>

        {step === "email" ? (
          <form onSubmit={submitEmail}>
            <p className={styles.lead}>
              Ingresa el correo con el que compraste en {businessName || "esta tienda"} y te enviaremos un código de acceso.
            </p>
            <label className={styles.label} htmlFor={`${fid}-email`}>Correo electrónico</label>
            <input
              id={`${fid}-email`}
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              data-autofocus
              required
            />
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button type="submit" className={styles.primaryBtn} disabled={reqM.isPending}>
              {reqM.isPending ? "Enviando..." : "Enviarme un código"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode}>
            <p className={styles.lead}>
              Te enviamos un código de 6 dígitos a <strong>{email}</strong>. Vence en 10 minutos.
            </p>
            <label className={styles.label} htmlFor={`${fid}-code`}>Código</label>
            <input
              id={`${fid}-code`}
              autoComplete="one-time-code"
              className={`${styles.input} ${styles.codeInput}`}
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              data-autofocus
            />
            {error && <p className={styles.error} role="alert">{error}</p>}
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
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { GiCancel } from "react-icons/gi";
import { BsFillSendFill } from "react-icons/bs";

import DialogModal from "./DialogModal";
import { contactTeam } from "../services/qataloApi";
import { useNotification } from "./UI/NotificationProvider";
import Loading from "./UI/Loading";
import styles from "./Footer.module.css";
import PrimaryButton from "./PrimaryButton";

const Footer = () => {
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { showError, showSuccess } = useNotification();
  const uid = useId();
  const year = new Date().getFullYear();

  const contact = useMutation({
    mutationFn: () => contactTeam({ name, email, message }),
    onSuccess: () => {
      showSuccess("Mensaje enviado", "Gracias por contactarnos, te responderemos pronto.");
      setShowContactDialog(false);
      setName("");
      setEmail("");
      setMessage("");
    },
    onError: (e) => showError("Error", e.message || "No se pudo enviar el mensaje"),
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    contact.mutate();
  };

  return (
    <>
      {contact.isPending && <Loading message="Enviando mensaje" />}

      {showContactDialog && (
        <DialogModal
          title="Contacta el equipo de Qatalo"
          visible={showContactDialog}
          onHide={() => setShowContactDialog(false)}
        >
          <form onSubmit={handleContactSubmit} className={styles.formContainer}>
            <div className={styles.field}>
              <label className="form-label" htmlFor={`${uid}-name`}>Nombre completo</label>
              <input id={`${uid}-name`} className={styles.inputField} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </div>
            <div className={styles.field}>
              <label className="form-label" htmlFor={`${uid}-email`}>Correo electrónico</label>
              <input id={`${uid}-email`} className={styles.inputField} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className={styles.field}>
              <label className="form-label" htmlFor={`${uid}-message`}>Mensaje</label>
              <textarea id={`${uid}-message`} className={styles.inputField} rows="5" value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>

            <div className={styles.actions}>
              <PrimaryButton type="button" variant="outline" onClick={() => setShowContactDialog(false)}>
                <GiCancel style={{ marginRight: "8px" }} /> Cancelar
              </PrimaryButton>

              <PrimaryButton type="submit" variant="primary" disabled={contact.isPending}>
                <BsFillSendFill style={{ marginRight: "8px" }} /> Enviar
              </PrimaryButton>
            </div>
          </form>
        </DialogModal>
      )}

      <footer className={styles.footer}>
        <div className={styles.inner}>
          <nav aria-label="Enlaces legales y contacto">
            <ul className={styles.links}>
              <li><Link to="/termsandconditions" className={styles.link}>Términos</Link></li>
              <li><Link to="/privacypolicy" className={styles.link}>Privacidad</Link></li>
              <li><Link to="/refundpolicy" className={styles.link}>Reembolso</Link></li>
              <li>
                <button type="button" className={styles.link} onClick={() => setShowContactDialog(true)}>
                  Contacto
                </button>
              </li>
            </ul>
          </nav>
          <p className={styles.copy}>&copy; {year} Qatalo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
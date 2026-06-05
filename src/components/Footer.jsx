import { useState } from "react";
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
            <div>
              <label className="form-label">Nombre Completo:</label>
              <input className={styles.inputField} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Correo Electrónico:</label>
              <input className={styles.inputField} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Mensaje:</label>
              <textarea className={styles.inputField} rows="5" value={message} onChange={(e) => setMessage(e.target.value)} required />
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
        <div className={styles.links}>
          <Link to="/termsandconditions" className={styles.link}>Términos</Link> |
          <Link to="/privacypolicy" className={styles.link}>Privacidad</Link> |
          <Link to="/refundpolicy" className={styles.link}>Reembolso</Link> |
          <span className={styles.link} onClick={() => setShowContactDialog(true)}>Contacto</span>
        </div>
        <p>&copy; 2025 Qatalo. Todos los derechos reservados.</p>
      </footer>
    </>
  );
};

export default Footer;
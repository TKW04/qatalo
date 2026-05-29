import { useState } from "react";
import { Link } from "react-router-dom";
import { GiCancel } from "react-icons/gi";
import { BsFillSendFill } from "react-icons/bs";

import DialogModal from "./DialogModal";
import { useDispatch } from "react-redux";
import { ContactTeam } from "../store/qatalo-store/qatalo-actions";
import { useNotification } from "./UI/NotificationProvider";
import Loading from "./UI/Loading";
import styles from "./Footer.module.css";

// 1. Importamos nuestro botón estandarizado
import PrimaryButton from "./PrimaryButton"; 

const Footer = () => {
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { showError, showSuccess } = useNotification();

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setShowContactDialog(false);
    setIsLoading(true);
    dispatch(ContactTeam(name, email, message, showError, showSuccess));
    setTimeout(() => setIsLoading(false), 4500);
  };

  return (
    <>
      {isLoading && <Loading message="Enviando mensaje" />}
      
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
            
            {/* 2. Reemplazamos los botones HTML por PrimaryButton */}
            <div className={styles.actions}>
              <PrimaryButton 
                type="button" 
                variant="outline" 
                onClick={() => setShowContactDialog(false)}
              >
                <GiCancel style={{ marginRight: "8px" }} /> Cancelar
              </PrimaryButton>
              
              <PrimaryButton 
                type="submit" 
                variant="primary"
              >
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
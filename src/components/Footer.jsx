import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

import { GiCancel } from "react-icons/gi";
import { BsFillSendFill } from "react-icons/bs";

import DialogModal from "./DialogModal";
import { useDispatch } from "react-redux";
import { ContactTeam } from "../store/qatalo-store/qatalo-actions";
import { useNotification } from "./UI/NotificationProvider";
import Loading from "./UI/Loading";

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
    setName("");
    setEmail("");
    setMessage("");
    setIsLoading(true);

    dispatch(ContactTeam(name, email, message, showError, showSuccess));

    setTimeout(() => {
      setIsLoading(false);
    }, 4500);
  };

  return (
    <>
      {isLoading && <Loading message="Enviando mensaje" />}
      {!isLoading && (
        <DialogModal
          title="Contacta el equipo de Qatalo"
          visible={showContactDialog}
          onHide={() => setShowContactDialog(false)}
          width={"30vw"}
        >
          <form onSubmit={handleContactSubmit}>
            <div className="grid mt-2">
              <div className="col-12">
                <label htmlFor="contactName" className="form-label">
                  Nombre Completo:
                </label>
                <InputText
                  id="contactName"
                  className="form-control"
                  style={{ width: "80%", height: "45px", padding: "10px" }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="col-12">
                <label htmlFor="contactEmail" className="form-label">
                  Correo Electrónico:
                </label>
                <InputText
                  id="contactEmail"
                  className="form-control"
                  style={{ width: "80%", height: "45px", padding: "10px" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="col-12">
                <label htmlFor="contactMessage" className="form-label">
                  Mensaje:
                </label>
                <InputTextarea
                  id="contactMessage"
                  className="form-control"
                  style={{ width: "80%", height: "150px", padding: "10px" }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="col-12">
                <div>
                  <Button
                    type="button"
                    label="Cancelar"
                    icon={<GiCancel style={{ margin: "5px" }} />}
                    onClick={() => setShowContactDialog(false)}
                    style={{
                      width: "110px",
                      height: "45px",
                      margin: "2px",
                      backgroundColor: "#f44336",
                      borderColor: "#ffffff",
                    }}
                  />
                  <Button
                    type="submit"
                    label="Enviar"
                    icon={<BsFillSendFill style={{ margin: "5px" }} />}
                    // onClick={handleContactSubmit}
                    style={{
                      width: "100px",
                      height: "45px",
                      margin: "2px",
                      backgroundColor: "#4CAF50",
                      borderColor: "#ffffff",
                    }}
                  />
                </div>
              </div>
            </div>
          </form>
        </DialogModal>
      )}
      <footer>
        <div
          className="grid justify-content-center align-items-center"
          style={{ marginLeft: "auto", marginRight: "auto" }}
        >
          <div className="col-12">
            <p>
              <Link
                target="_blank"
                to="/terms-and-conditions"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Términos de Servicio
              </Link>
              {" | "}
              <Link
                target="_blank"
                to="/privacy-policy"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Política de Privacidad
              </Link>
              {" | "}
              <Link
                target="_blank"
                to="/refund-policy"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Política de Reembolso
              </Link>
              {" | "}
              <Link
                style={{ textDecoration: "none", color: "inherit" }}
                onClick={() => {
                  setShowContactDialog(true);
                }}
              >
                Contacto
              </Link>
            </p>
            <p>&copy; 2025 Qatalo. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;

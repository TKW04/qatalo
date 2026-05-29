import { formatDate } from "../../helpers/utils";
import Navbar from "../Navbar"; 
import Footer from "../../components/Footer"; 
// Reutilizamos el mismo CSS Module para mantener el diseño idéntico
import styles from "./TermsAndConditions.module.css"; 

const PrivacyNotice = () => {
  return (
    <>
      <Navbar />

      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <div className={styles.headerImageContainer}>
            <img
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
              alt="Qatalo Logo"
              className={styles.logo}
              loading="lazy"
            />
          </div>

          <div className={styles.content}>
            <h1 className={styles.title}>Política de Privacidad</h1>
            
            <p>
              Última actualización: <strong>[{formatDate(new Date())}]</strong>
            </p>
            <p>
              En <strong>qatalo.online</strong> valoramos tu privacidad y estamos comprometidos a
              proteger tus datos personales.
            </p>

            <h2>Información que recolectamos</h2>
            <ul>
              <li><strong>Datos de registro:</strong> nombre, correo electrónico, contraseña.</li>
              <li><strong>Datos del negocio:</strong> nombre, logo, descripción, productos.</li>
              <li><strong>Datos de uso:</strong> información sobre cómo interactúas con la plataforma.</li>
              <li><strong>Datos de pago:</strong> procesados de forma segura a través de proveedores externos (Paddle).</li>
            </ul>

            <h2>Uso de la información</h2>
            <ul>
              <li>Para brindarte acceso al servicio.</li>
              <li>Para procesar pagos y facturación.</li>
              <li>Para enviarte notificaciones relacionadas con tu cuenta o actualizaciones del servicio.</li>
            </ul>

            <h2>Protección de datos</h2>
            <ul>
              <li>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información.</li>
              <li>No vendemos ni compartimos tus datos con terceros, salvo que sea necesario para proveer el servicio o por obligación legal.</li>
            </ul>

            <h2>Derechos del usuario</h2>
            <ul>
              <li>Acceder, rectificar o eliminar tus datos personales.</li>
              <li>Solicitar la limitación u oposición al tratamiento de tus datos.</li>
            </ul>
            
            <p>
              Para ejercer tus derechos, o si tienes alguna duda, puedes escribirnos a: <strong>correo@qatalo.online</strong>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PrivacyNotice;
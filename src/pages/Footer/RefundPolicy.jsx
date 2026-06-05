import { formatDate } from "../../helpers/utils";
import Navbar from "../Navbar";
import Footer from "../../components/Footer";
import styles from "./TermsAndConditions.module.css";

const RefundPolicy = () => {
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
            <h1 className={styles.title}>Política de Reembolso</h1>
            
            <p>
              Última actualización: <strong>[{formatDate(new Date())}]</strong>
            </p>
            <p>
              En <strong>qatalo.online</strong> buscamos ofrecerte un servicio confiable y
              transparente.
            </p>

            <h2>Condiciones de reembolso</h2>
            <ul>
              <li>
                Se ofrecen reembolsos únicamente dentro de los [14] días
                posteriores a la compra de una suscripción o servicio, siempre
                que el usuario no haya hecho uso significativo de la plataforma.
              </li>
              <li>
                No se otorgarán reembolsos por períodos ya transcurridos de
                suscripciones activas.
              </li>
            </ul>

            <h2>Pagos procesados por terceros</h2>
            <ul>
              <li>
                Dado que los pagos son procesados por plataformas externas
                (Paddle), los reembolsos se realizarán a través del mismo método
                de pago utilizado.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default RefundPolicy;
import { Link } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../../components/Footer";
import styles from "./TermsAndConditions.module.css";

const CONTACT_EMAIL = "info@qatalo.online";

const FAQS = [
  {
    q: "¿Cómo accedo a mi cuenta?",
    a: (
      <p>
        Entra en <Link to="/login">Iniciar sesión</Link> con el correo y la contraseña con los que te
        registraste. Si aún no tienes cuenta, puedes <Link to="/register">crear una aquí</Link>. En la
        app de iOS se usan las mismas credenciales.
      </p>
    ),
  },
  {
    q: "Olvidé mi contraseña, ¿cómo la recupero?",
    a: (
      <p>
        En la pantalla de inicio de sesión pulsa <strong>«¿Olvidaste tu contraseña?»</strong> o ve
        directamente a <Link to="/forgotpassword">recuperar contraseña</Link>. Te enviaremos un correo
        con los pasos para crear una nueva. Si no lo ves, revisa la carpeta de spam. Si ya tienes la
        sesión iniciada, puedes cambiarla en <strong>Cambiar contraseña</strong> dentro del panel.
      </p>
    ),
  },
  {
    q: "¿Cómo creo mis productos?",
    a: (
      <p>
        En el panel, abre la sección <strong>Productos</strong> y pulsa <strong>Crear producto</strong>.
        Añade el nombre, el precio, la descripción y las fotos. Te recomendamos crear antes tus{" "}
        <strong>Categorías</strong> para mantener el catálogo ordenado.
      </p>
    ),
  },
  {
    q: "¿Cómo comparto mi catálogo o mi código QR?",
    a: (
      <p>
        En la sección <strong>Código QR</strong> del panel encontrarás el QR de tu catálogo y el enlace
        público para copiarlo y compartirlo por WhatsApp, redes sociales o imprimirlo en tu local. El
        botón <strong>Ver catálogo público</strong> te muestra cómo lo ven tus clientes.
      </p>
    ),
  },
  {
    q: "¿Cómo recibo los pedidos de mis clientes?",
    a: (
      <p>
        Tus clientes eligen productos en tu catálogo, indican sus datos y el método de pago, y envían el
        pedido. Lo verás en la sección <strong>Órdenes</strong> del panel, donde puedes revisarlo,
        ver los comprobantes de pago que adjunten y actualizar su estado. Configura antes tus{" "}
        <strong>Métodos de pago</strong> para que tus clientes puedan completar la compra.
      </p>
    ),
  },
  {
    q: "¿Cómo elimino mi cuenta?",
    a: (
      <>
        <p>
          Desde la app de iOS, en <strong>Más &gt; Ajustes &gt; pestaña Cuenta &gt; Eliminar cuenta</strong>, o escribiendo a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> desde el correo asociado a tu cuenta.
        </p>
        <p>
          Tu catálogo se desactiva al instante y tus datos se borran en un máximo de 30 días, salvo los
          comprobantes fiscales que la ley obliga a conservar. Más detalles en la{" "}
          <Link to="/privacypolicy">Política de Privacidad</Link>.
        </p>
      </>
    ),
  },
];

const Support = () => {
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
            <h1 className={styles.title}>Soporte</h1>

            <p>
              ¿Necesitas ayuda con Qatalo? Aquí tienes las respuestas a las dudas más comunes y la forma
              de contactarnos.
            </p>

            <h2>Contacto</h2>
            <p>
              Escríbenos a <a href={`mailto:${CONTACT_EMAIL}`}><strong>{CONTACT_EMAIL}</strong></a>.
              Respondemos lo antes posible. Para ayudarte más
              rápido, indica el correo de tu cuenta y el nombre de tu negocio.
            </p>
            <p>
              También puedes usar el enlace <strong>Contacto</strong> al pie de esta página para
              enviarnos un mensaje.
            </p>

            <h2>Preguntas frecuentes</h2>
            <div className={styles.faqList}>
              {FAQS.map(({ q, a }) => (
                <details key={q} className={styles.faqItem}>
                  <summary className={styles.faqQuestion}>{q}</summary>
                  <div className={styles.faqAnswer}>{a}</div>
                </details>
              ))}
            </div>

            <h2>Información legal</h2>
            <ul>
              <li><Link to="/privacypolicy">Política de Privacidad</Link></li>
              <li><Link to="/termsandconditions">Términos de Servicio</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Support;

import { Link } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../../components/Footer";
import styles from "./TermsAndConditions.module.css";
import own from "./AndroidDownload.module.css";

// Datos de la versión publicada: actualizar aquí en cada release del APK.
export const APK_URL = "https://qatalo.online/downloads/qatalo.apk";
export const APK_VERSION = "1.0.0";
export const APK_RELEASE_DATE = "2026-10-09";
// Rellenar al publicar con: shasum -a 256 qatalo.apk
export const APK_SHA256 = "PENDIENTE — rellenar con el SHA-256 del APK publicado";

const CONTACT_EMAIL = "info@qatalo.online";

const AndroidDownload = () => {
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
            <h1 className={styles.title}>Qatalo para Android</h1>

            <p>
              Descarga la app de Qatalo para Android directamente desde nuestra web. Usa el mismo correo y
              contraseña de tu cuenta de Qatalo.
            </p>

            <div className={own.downloadBox}>
              <a className={own.downloadButton} href={APK_URL} download>
                Descargar APK
              </a>
              <p className={own.meta}>
                Versión <strong>{APK_VERSION}</strong> · Publicada el {APK_RELEASE_DATE}
              </p>
              <p className={own.meta}>SHA-256:</p>
              <code className={own.hash}>{APK_SHA256}</code>
            </div>

            <h2>Cómo instalarla</h2>
            <ol>
              <li>
                Abre esta página desde tu teléfono Android y pulsa <strong>Descargar APK</strong>. Si el
                navegador avisa de que el archivo puede ser dañino, elige <strong>Descargar de todos modos</strong>.
              </li>
              <li>
                Cuando termine la descarga, toca la notificación o abre el archivo <strong>qatalo.apk</strong>{" "}
                desde la carpeta <strong>Descargas</strong>.
              </li>
              <li>
                Si aparece el mensaje «Por tu seguridad, tu teléfono no puede instalar apps desconocidas de
                esta fuente», pulsa <strong>Ajustes</strong>.
              </li>
              <li>
                Activa <strong>Permitir de esta fuente</strong> para el navegador que usaste (por ejemplo,
                Chrome). También puedes hacerlo en <strong>Ajustes &gt; Apps &gt; Acceso especial &gt;
                Instalar apps desconocidas</strong>; el nombre exacto puede variar según el fabricante.
              </li>
              <li>
                Vuelve atrás y pulsa <strong>Instalar</strong>. Al terminar, abre Qatalo e inicia sesión.
              </li>
              <li>
                Opcional: una vez instalada, puedes desactivar de nuevo el permiso del navegador.
              </li>
            </ol>

            <h2>Aviso de Google Play Protect</h2>
            <div className={own.notice}>
              <p>
                Como la app se instala fuera de Google Play, Play Protect puede mostrar una advertencia
                como «App no segura bloqueada» o pedirte que la analices. Es normal en apps distribuidas
                fuera de la tienda.
              </p>
              <p>
                Para continuar, pulsa <strong>Más detalles</strong> y luego <strong>Instalar de todos
                modos</strong> (o <strong>Analizar app</strong> y después instalar). Descarga el APK solo
                desde esta página y, si quieres, compara su SHA-256 con el indicado arriba.
              </p>
            </div>

            <h2>Eliminar tu cuenta</h2>
            <p>
              Puedes eliminar tu cuenta desde la app en <strong>Más &gt; Ajustes &gt; pestaña Cuenta &gt;
              Eliminar cuenta</strong>, o escribiendo a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
              desde el correo asociado a tu cuenta. Los detalles sobre qué datos se borran están en la
              sección «Conservación y eliminación de la cuenta» de la{" "}
              <Link to="/privacypolicy">Política de Privacidad</Link>.
            </p>

            <h2>Más información</h2>
            <ul>
              <li><Link to="/soporte">Soporte y preguntas frecuentes</Link></li>
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

export default AndroidDownload;

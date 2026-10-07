import { Link } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../../components/Footer";
// Reutilizamos el mismo CSS Module para mantener el diseño idéntico
import styles from "./TermsAndConditions.module.css";

const CONTACT_EMAIL = "info@qatalo.online";

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
              Última actualización: <strong>7 de octubre de 2026</strong>
            </p>
            <p>
              En <strong>Qatalo</strong> valoramos tu privacidad. Esta política explica qué datos
              personales tratamos, para qué los usamos, con quién los compartimos y qué derechos
              tienes sobre ellos.
            </p>

            <h2>1. Responsable y ámbito</h2>
            <p>
              El responsable del tratamiento es <strong>Qatalo</strong>, con domicilio en la República
              Dominicana y correo de contacto <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
            <p>Esta política se aplica a:</p>
            <ul>
              <li>El sitio web <strong>qatalo.online</strong> y su panel de administración.</li>
              <li>Los catálogos públicos que los negocios publican con Qatalo.</li>
              <li>La aplicación de Qatalo para iOS.</li>
            </ul>

            <h2>2. Datos de los dueños de negocio</h2>
            <p>Si creas una cuenta para gestionar tu negocio, tratamos:</p>
            <ul>
              <li><strong>Datos de cuenta:</strong> nombre, apellido, correo electrónico y contraseña (la contraseña se gestiona cifrada; no la conocemos).</li>
              <li><strong>Datos del negocio:</strong> nombre, descripción, teléfono, localidades, horarios de atención, métodos de pago que ofreces a tus clientes y datos fiscales como RNC y secuencias de NCF.</li>
              <li><strong>Contenido que subes:</strong> logo, fotos y descripciones de productos, categorías, ofertas y fuentes tipográficas personalizadas.</li>
              <li><strong>Datos de suscripción:</strong> plan contratado y estado de la suscripción. Los datos de tu tarjeta los procesa directamente nuestro proveedor de pagos; Qatalo no los almacena.</li>
              <li><strong>Datos técnicos:</strong> información básica necesaria para el funcionamiento y la seguridad del servicio (por ejemplo, la sesión iniciada en tu dispositivo).</li>
            </ul>

            <h2>3. Datos de los clientes que compran en un catálogo</h2>
            <p>
              Cuando una persona hace un pedido en el catálogo de un negocio, se tratan los datos que
              introduce para ese pedido:
            </p>
            <ul>
              <li>Nombre, apellido, correo electrónico, teléfono (incluido el número de WhatsApp de confirmación) y, si lo indica, su edad.</li>
              <li>Dirección de entrega, cuando el pedido es a domicilio.</li>
              <li>Detalle del pedido, método de pago elegido y, si los sube, comprobantes de pago (imagen de la transferencia, monto, fecha y referencia).</li>
            </ul>
            <p>
              Respecto a estos datos, <strong>el responsable es el negocio</strong> al que se le hace el
              pedido, y <strong>Qatalo actúa como encargado del tratamiento</strong>: los almacena y procesa
              por cuenta del negocio y únicamente para prestarle el servicio. Si eres cliente de un
              negocio y quieres ejercer tus derechos, puedes dirigirte a ese negocio o escribirnos y lo
              trasladaremos.
            </p>

            <h2>4. Para qué usamos los datos</h2>
            <ul>
              <li>Prestar el servicio: crear y mostrar catálogos, productos y códigos QR.</li>
              <li>Gestionar pedidos entre los negocios y sus clientes, incluido el acceso de los clientes a sus pedidos mediante un código enviado por correo.</li>
              <li>Facturación: gestionar la suscripción del negocio y permitir al negocio emitir comprobantes de sus ventas.</li>
              <li>Atender solicitudes de soporte y mensajes enviados por el formulario de contacto.</li>
              <li>
                Enviar correos transaccionales relacionados con la cuenta o los pedidos (por ejemplo,
                códigos de acceso, recuperación de contraseña, comprobantes y el correo de bienvenida con
                instrucciones para activar un plan).
              </li>
              <li>
                Enviar, ocasionalmente, comunicaciones informativas sobre el servicio. Puedes darte de
                baja de estas en cualquier momento escribiendo a{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>; los correos transaccionales
                seguirán enviándose mientras tengas la cuenta activa.
              </li>
              <li>Cumplir obligaciones legales y proteger la seguridad de la plataforma.</li>
            </ul>
            <p>No vendemos datos personales ni los usamos para publicidad de terceros.</p>

            <h2>5. Proveedores con los que compartimos datos</h2>
            <p>
              Solo compartimos datos con proveedores que necesitamos para prestar el servicio, o cuando
              la ley nos obliga:
            </p>
            <ul>
              <li><strong>Amazon Web Services (AWS):</strong> alojamiento, autenticación de usuarios (Cognito), almacenamiento de imágenes y archivos (S3), base de datos (DynamoDB) y envío de correos (SES).</li>
              <li><strong>Paddle:</strong> procesa los pagos de las suscripciones de los negocios en el sitio web, como revendedor autorizado.</li>
              <li><strong>Google Fonts:</strong> sirve tipografías del sitio y de los catálogos; al cargarlas, tu navegador se conecta con servidores de Google.</li>
            </ul>
            <p>
              Algunos de estos proveedores pueden tratar datos fuera de la República Dominicana, con
              medidas de protección adecuadas.
            </p>

            <h2>6. Analítica y rastreo</h2>
            <ul>
              <li>Qatalo no incorpora herramientas de analítica publicitaria propias en el sitio web.</li>
              <li>
                Un negocio puede configurar en su catálogo su propio identificador de Google Analytics 4
                o de Meta Pixel. En ese caso, esas herramientas se cargan <strong>solo en el catálogo de
                ese negocio</strong> y registran visitas y eventos (por ejemplo, ver un producto o
                completar una compra). El negocio es responsable de ese uso y de informar a sus
                clientes.
              </li>
              <li>La aplicación de Qatalo para iOS <strong>no rastrea</strong> a sus usuarios ni comparte datos con fines publicitarios.</li>
              <li>
                Usamos el almacenamiento local de tu navegador para mantener tu sesión iniciada, tu
                carrito y algunas preferencias de visualización.
              </li>
            </ul>

            <h2>7. Conservación y eliminación de la cuenta</h2>
            <p>
              Conservamos los datos mientras tu cuenta esté activa. Puedes eliminar tu cuenta en
              cualquier momento:
            </p>
            <ul>
              <li>Desde la app de iOS, en <strong>Ajustes &gt; Eliminar cuenta</strong>.</li>
              <li>Escribiendo a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> desde el correo asociado a tu cuenta.</li>
            </ul>
            <p>Al eliminar la cuenta:</p>
            <ul>
              <li>Tu catálogo se desactiva al instante y deja de ser visible públicamente.</li>
              <li>Tu suscripción se cancela, sin reembolso del periodo en curso.</li>
              <li>Borramos tus datos y los de tu negocio, incluidos los datos de tus clientes y pedidos, en un plazo máximo de 30 días.</li>
              <li>Solo conservamos los comprobantes fiscales que exige la normativa tributaria dominicana, durante el plazo legal correspondiente.</li>
            </ul>

            <h2>8. Tus derechos</h2>
            <p>
              De acuerdo con la Ley 172-13 de la República Dominicana sobre protección de datos de
              carácter personal, puedes solicitar el <strong>acceso</strong>, la{" "}
              <strong>rectificación</strong> y la <strong>supresión</strong> de tus datos personales.
              Escríbenos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> y te responderemos
              en los plazos que establece la ley. Podemos pedirte que verifiques tu identidad antes de
              atender la solicitud.
            </p>

            <h2>9. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger los datos: conexiones
              cifradas (HTTPS), contraseñas gestionadas por un servicio de autenticación especializado
              y acceso restringido a la información. Ningún sistema es completamente infalible, pero
              trabajamos para minimizar los riesgos.
            </p>

            <h2>10. Menores de edad</h2>
            <p>
              Qatalo está dirigido a negocios y no está pensado para menores de edad. No recopilamos
              conscientemente datos de menores; si detectas que un menor nos ha facilitado datos,
              escríbenos y los eliminaremos.
            </p>

            <h2>11. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política para reflejar cambios en el servicio o en la ley.
              Publicaremos la nueva versión en esta página con su fecha de actualización y, si los
              cambios son importantes, te avisaremos por correo.
            </p>

            <h2>12. Contacto</h2>
            <p>
              Para cualquier duda sobre esta política o tus datos, escríbenos a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o visita nuestra página de{" "}
              <Link to="/soporte">Soporte</Link>.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PrivacyNotice;

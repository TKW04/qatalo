import { Card } from "primereact/card";
import { Image } from "primereact/image";

const TermsAndConditions = () => {
  const header = (
    <>
      <div
        style={{
          marginLeft: "auto",
          marginRight: "auto",
          marginBottom: "1rem",
          marginTop: "1rem",
          border: "4px var(--color-navy) solid",
          borderRadius: "10px",
          width: "100%",
        }}
      >
        <div
          style={{
            padding: "0rem",
            width: "300px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <Image
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo_blue.png"
            alt="Card"
            style={{ padding: "0rem" }}
          />
        </div>
      </div>
    </>
  );
  return (
    <div className="card flex justify-content-center">
      <Card
        title="Detalle de sus compras"
        header={header}
        style={{
          marginTop: "0rem",
          marginBottom: "2rem",
          padding: "1rem",
          borderRadius: "10px",
          width: "100%",
        }}
      >
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <h1>Términos y Condiciones</h1>
          <p>
            Última actualización: [Fecha de hoy] Bienvenido a Qatalo.online. Al
            acceder y utilizar nuestra plataforma, aceptas cumplir con los
            presentes Términos y Condiciones. Si no estás de acuerdo con ellos,
            te recomendamos no utilizar nuestros servicios.
          </p>
          <h2>1. Objeto del Servicio</h2>
          <p>
            Qatalo.online ofrece a sus usuarios la posibilidad de crear
            catálogos digitales personalizados y generar códigos QR que
            facilitan la distribución y visualización de dichos catálogos en
            línea.
          </p>
          <h2>2. Registro y Uso de la Cuenta</h2>
          <p>
            <ul>
              <li>
                Para acceder a ciertas funcionalidades, el usuario debe
                registrarse proporcionando información veraz, completa y
                actualizada.
              </li>
              <li>
                El usuario es responsable de mantener la confidencialidad de sus
                credenciales de acceso.
              </li>
              <li>
                Qatalo.online no se responsabiliza por el uso indebido de la
                cuenta ocasionado por negligencia del usuario.
              </li>
            </ul>
          </p>
          <h2>3. Uso Aceptable</h2>
          <p>
            El usuario se compromete a:
            <ul>
              <li>
                No utilizar el servicio para publicar, compartir o distribuir
                contenido ilegal, ofensivo, fraudulento o que infrinja derechos
                de terceros.
              </li>
              <li>
                No interferir con la seguridad o el funcionamiento de la
                plataforma.
              </li>
              <li>
                Respetar las leyes aplicables en la República Dominicana y en su
                país de residencia.
              </li>
            </ul>
          </p>
          <h2>4. Contenido del Usuario</h2>
          <p>
            <ul>
              <li>
                Los catálogos y materiales subidos a la plataforma son de
                exclusiva responsabilidad del usuario.
              </li>
              <li>
                El usuario declara ser titular de los derechos sobre el
                contenido que publique o contar con las autorizaciones
                necesarias para su uso.
              </li>
              <li>
                Qatalo.online no reclama la propiedad de los catálogos creados,
                pero el usuario concede una licencia limitada para almacenarlos
                y mostrarlos en la plataforma.
              </li>
            </ul>
          </p>
          <h2>5. Propiedad Intelectual</h2>
          <p>
            Todos los derechos sobre el software, diseño, logotipo, marca y
            demás elementos propios de Qatalo.online son propiedad de sus
            titulares legales. Queda prohibido su uso no autorizado.
          </p>
          <h2>6. Limitación de Responsabilidad</h2>
          <p>
            <ul>
              <li>
                Qatalo.online no garantiza la disponibilidad continua e
                ininterrumpida del servicio.
              </li>
              <li>
                No nos hacemos responsables por pérdidas de datos,
                interrupciones o daños ocasionados por fallas técnicas, ataques
                o causas de fuerza mayor.
              </li>
              <li>
                El uso de la plataforma es bajo responsabilidad del usuario.
              </li>
            </ul>
          </p>
          <h2>7. Planes y Pagos</h2>
          <p>
            <ul>
              <li>
                Las funcionalidades de Qatalo.online están sujetas a planes de
                pago.
              </li>
              <li>
                Los precios, condiciones y métodos de pago estarán disponibles
                en la plataforma y podrán ser modificados con previo aviso.
              </li>
              <li>
                No se realizarán reembolsos salvo que la legislación aplicable
                lo exija.
              </li>
            </ul>
          </p>
          <h2>8. Enlaces a Terceros</h2>
          <p>
            La plataforma puede contener enlaces a sitios externos.
            Qatalo.online no controla ni asume responsabilidad por el contenido
            o prácticas de dichos sitios.
          </p>
          <h2>9. Modificaciones</h2>
          <p>
            Qatalo.online podrá modificar los presentes Términos y Condiciones
            en cualquier momento. Los cambios se publicarán en esta página y
            entrarán en vigor inmediatamente después de su publicación.
          </p>
          <h2>10. Legislación Aplicable</h2>
          <p>
            Estos Términos y Condiciones se regirán por las leyes de la
            República Dominicana. Cualquier disputa se someterá a los tribunales
            competentes de Santo Domingo.
          </p>
          <h2>11. Contacto</h2>
          <p>
            Si tienes preguntas sobre estos Términos y Condiciones, puedes
            escribirnos a: correo@qatalo.online
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TermsAndConditions;

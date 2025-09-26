import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { formatDate } from "../helpers/utils";

const PrivacyNotice = () => {
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
          <h1 style={{ textAlign: "center", margin: "10px" }}>
            Términos de Servicio
          </h1>
          <p>Última actualización: [{formatDate(new Date())}]</p>
          <p>
            En qatalo.online valoramos tu privacidad y estamos comprometidos a
            proteger tus datos personales.
          </p>
          <h2>Información que recolectamos</h2>
          <p>
            <ul>
              <li>
                Datos de registro: nombre, correo electrónico, contraseña.
              </li>
              <li>Datos del negocio: nombre, logo, descripción, productos.</li>
              <li>
                {" "}
                Datos de uso: información sobre cómo interactúas con la
                plataforma.
              </li>
              <li>
                Datos de pago: procesados de forma segura a través de
                proveedores externos (Paddle).
              </li>
            </ul>
          </p>
          <h2>Uso de la información</h2>
          <p>
            <ul>
              <li>Para brindarte acceso al servicio.</li>
              <li>Para procesar pagos y facturación.</li>
              <li>
                Para enviarte notificaciones relacionadas con tu cuenta o
                actualizaciones del servicio.
              </li>
            </ul>
          </p>
          <h2>Protección de datos</h2>
          <p>
            <ul>
              <li>
                Implementamos medidas de seguridad técnicas y organizativas para
                proteger tu información.
              </li>
              <li>
                No vendemos ni compartimos tus datos con terceros, salvo que sea
                necesario para proveer el servicio o por obligación legal.
              </li>
            </ul>
          </p>
          <h2>Derechos del usuario</h2>
          <p>
            <ul>
              <li>Acceder, rectificar o eliminar tus datos personales.</li>
              <li>
                Solicitar la limitación u oposición al tratamiento de tus datos.
              </li>
            </ul>
            {/* Para ejercer tus derechos, puedes escribirnos a: */}
            {/* [info@qatalo.online] */}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyNotice;

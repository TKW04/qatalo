import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { formatDate } from "../helpers/utils";

const RefundPolicy = () => {
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
            Política de Reembolso
          </h1>
          <p>Última actualización: [{formatDate(new Date())}]</p>
          <p>
            En qatalo.online buscamos ofrecerte un servicio confiable y
            transparente.
          </p>
          <h2>Condiciones de reembolso</h2>
          <p>
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
          </p>
          <h2>Pagos procesados por terceros</h2>
          <p>
            <ul>
              <li>
                Dado que los pagos son procesados por plataformas externas
                (Paddle), los reembolsos se realizarán a través del mismo método
                de pago utilizado.
              </li>
            </ul>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RefundPolicy;

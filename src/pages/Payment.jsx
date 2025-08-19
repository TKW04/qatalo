import { Image } from "primereact/image";
import "./Payment.css";
const Payment = () => {
  return (
    <div class="container-payment">
      <header>
        <div class="logo-payment">
          <Image
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
            alt="CatalogQR Logo"
            width={200}
            style={{ padding: "0rem" }}
          />
        </div>
        <div class="subtitle">
          Automatiza tu flujo de trabajo con la plataforma más avanzada
        </div>
      </header>

      <section class="pricing-section">
        <h1 class="section-title">Planes y Precios</h1>

        <div class="plans-grid">
          <div class="plan-card">
            <h3 class="plan-name">Básico</h3>
            <p class="plan-description">
              Perfect para equipos pequeños que están comenzando
            </p>
            <div class="plan-price">
              <span class="currency">$</span>
              <span id="basic-price">29</span>
            </div>
            <div class="plan-period">por usuario/mes</div>
            <ul class="plan-features">
              <li>1 catálogo</li>
              <li>Categorías ilimitadas</li>
              <li>Productos ilimitados</li>
              <li>Manejo de clientes</li>
              <li>Integración con Whatsapp</li>
            </ul>
            <button class="plan-button secondary">Comenzar Gratis</button>
          </div>
        </div>

        <div class="money-back">
          <h3>🛡️ Garantía de 30 días</h3>
          <p>
            Si no estás completamente satisfecho, te devolvemos tu dinero sin
            preguntas.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Payment;

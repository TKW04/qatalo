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

        <div class="pricing-toggle">
          <div class="toggle-container-payment">
            <div
              class="toggle-option active"
              onclick="togglePricing('monthly')"
            >
              Mensual
            </div>
            <div class="toggle-option" onclick="togglePricing('yearly')">
              Anual
            </div>
          </div>
          <div class="discount-badge">¡Ahorra 20%!</div>
        </div>

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
              <li>Hasta 5 usuarios</li>
              <li>10 GB de almacenamiento</li>
              <li>Automatizaciones básicas</li>
              <li>Soporte por email</li>
              <li>Integraciones limitadas</li>
              <li class="unavailable">Reportes avanzados</li>
              <li class="unavailable">API personalizada</li>
            </ul>
            <button class="plan-button secondary">Comenzar Gratis</button>
          </div>

          <div class="plan-card featured">
            <h3 class="plan-name">Professional</h3>
            <p class="plan-description">
              Ideal para equipos en crecimiento que necesitan más potencia
            </p>
            <div class="plan-price">
              <span class="currency">$</span>
              <span id="pro-price">79</span>
            </div>
            <div class="plan-period">por usuario/mes</div>
            <ul class="plan-features">
              <li>Hasta 25 usuarios</li>
              <li>100 GB de almacenamiento</li>
              <li>Automatizaciones avanzadas</li>
              <li>Soporte prioritario 24/7</li>
              <li>Integraciones ilimitadas</li>
              <li>Reportes avanzados</li>
              <li>Análisis de datos</li>
            </ul>
            <button class="plan-button primary">Prueba Gratuita</button>
          </div>

          <div class="plan-card">
            <h3 class="plan-name">Enterprise</h3>
            <p class="plan-description">
              Para grandes organizaciones con necesidades específicas
            </p>
            <div class="plan-price">
              <span class="currency">$</span>
              <span id="enterprise-price">199</span>
            </div>
            <div class="plan-period">por usuario/mes</div>
            <ul class="plan-features">
              <li>Usuarios ilimitados</li>
              <li>Almacenamiento ilimitado</li>
              <li>Automatizaciones personalizadas</li>
              <li>Gerente de cuenta dedicado</li>
              <li>API personalizada</li>
              <li>Seguridad avanzada</li>
              <li>Implementación personalizada</li>
            </ul>
            <button class="plan-button secondary">Contactar Ventas</button>
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

      <section class="faq-section">
        <h2 class="faq-title">Preguntas Frecuentes</h2>

        <div class="faq-item">
          <div class="faq-question" onclick="toggleFAQ(this)">
            ¿Puedo cambiar de plan en cualquier momento?
            <span>+</span>
          </div>
          <div class="faq-answer">
            Sí, puedes actualizar o reducir tu plan en cualquier momento. Los
            cambios se reflejarán en tu próxima facturación.
          </div>
        </div>

        <div class="faq-item">
          <div class="faq-question" onclick="toggleFAQ(this)">
            ¿Hay descuentos para organizaciones sin fines de lucro?
            <span>+</span>
          </div>
          <div class="faq-answer">
            Sí, ofrecemos descuentos especiales del 30% para organizaciones sin
            fines de lucro y educativas. Contáctanos para más información.
          </div>
        </div>

        <div class="faq-item">
          <div class="faq-question" onclick="toggleFAQ(this)">
            ¿Qué métodos de pago aceptan?
            <span>+</span>
          </div>
          <div class="faq-answer">
            Aceptamos todas las tarjetas de crédito principales, PayPal, y
            transferencias bancarias para planes Enterprise.
          </div>
        </div>

        <div class="faq-item">
          <div class="faq-question" onclick="toggleFAQ(this)">
            ¿Incluye el precio el soporte técnico?
            <span>+</span>
          </div>
          <div class="faq-answer">
            Todos los planes incluyen soporte técnico. El plan Básico incluye
            soporte por email, mientras que Professional y Enterprise incluyen
            soporte prioritario 24/7.
          </div>
        </div>
      </section>
    </div>
  );
};

export default Payment;

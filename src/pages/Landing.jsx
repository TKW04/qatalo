import {
  Building2,
  FolderOpen,
  Package,
  QrCode,
  MessageCircle,
  ChartNoAxesCombined,
} from "lucide-react";
import { Image } from "primereact/image";

import "./Landing.css";

const Landing = () => {
  return (
    <div className="landing">
      <header>
        <nav>
          <div>
            <Image
              src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
              alt="CatalogQR Logo"
              width={100}
            />
          </div>
          <ul className="nav-links">
            <li>
              <a href="#inicio">Inicio</a>
            </li>
            <li>
              <a href="#caracteristicas">Características</a>
            </li>
            <li>
              <a href="#como-funciona">Cómo Funciona</a>
            </li>
            <li>
              <a href="#precios">Precios</a>
            </li>
          </ul>
          <a href="#" className="cta-button">
            Comenzar Gratis
          </a>
        </nav>
      </header>
      <section className="hero" id="inicio">
        <div className="hero-content" style={{ paddingTop: "100px" }}>
          <h1>Tu Catálogo Digital con QR</h1>
          <p>
            Crea catálogos interactivos, conecta con WhatsApp y recibe pedidos
            directamente. Todo en una plataforma fácil de usar.
          </p>
          <div className="hero-cta">
            <a href="#" className="primary-btn pulse">
              Crear Mi Catálogo
            </a>
            <a href="/demo/admin" className="secondary-btn">
              Ver Demo
            </a>
          </div>
        </div>
      </section>
      <section className="features" id="caracteristicas">
        <div className="container">
          <div className="section-title-1">
            <h2>Todo lo que necesitas para vender más</h2>
            <p>Una plataforma completa para digitalizar tu negocio</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Building2 />
              </div>
              <h3>Crea tu Empresa</h3>
              <p>
                Configura tu perfil empresarial con logo, información de
                contacto y datos de tu negocio en minutos.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FolderOpen />
              </div>
              <h3>Organiza Categorías</h3>
              <p>
                Estructura tu catálogo con categorías personalizadas para que
                tus clientes encuentren fácilmente lo que buscan.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Package />
              </div>
              <h3>Gestiona Productos</h3>
              <p>
                Añade productos con fotos, descripciones, precios y variaciones.
                Todo desde una interfaz intuitiva.
              </p>
            </div>

            <div className="feature-card ">
              <div className="feature-icon">
                <QrCode />
              </div>
              <h3>Códigos QR</h3>
              <p>
                Genera códigos QR únicos para tu catálogo y compártelos en
                físico o digital para acceso instantáneo.
              </p>
            </div>

            <div className="feature-card ">
              <div className="feature-icon">
                <MessageCircle />
              </div>
              <h3>Integración WhatsApp</h3>
              <p>
                Conecta tu WhatsApp Business y recibe pedidos directamente.
                Automatiza el proceso de ventas.
              </p>
            </div>

            <div className="feature-card ">
              <div className="feature-icon">
                <ChartNoAxesCombined />
              </div>
              <h3>Analytics Avanzados</h3>
              <p>
                Monitorea visitas, productos más solicitados y rendimiento de tu
                catálogo con reportes detallados.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="como-funciona">
        <div className="container">
          <div className="section-title">
            <h2>Cómo Funciona</h2>
            <p>En 4 simples pasos tendrás tu catálogo digital funcionando</p>
          </div>

          <div className="steps">
            <div className="step ">
              <div className="step-number">1</div>
              <h3>Registra tu Empresa</h3>
              <p>Crea tu cuenta y configura los datos básicos de tu negocio</p>
            </div>

            <div className="step ">
              <div className="step-number">2</div>
              <h3>Añade Productos</h3>
              <p>
                Crea categorías y sube tus productos con fotos y descripciones
              </p>
            </div>

            <div className="step ">
              <div className="step-number">3</div>
              <h3>Genera tu QR</h3>
              <p>
                Obtén tu código QR personalizado y compártelo con tus clientes
              </p>
            </div>

            <div className="step ">
              <div className="step-number">4</div>
              <h3>Recibe Pedidos</h3>
              <p>
                Los clientes escanean, seleccionan productos y te contactan vía
                WhatsApp
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>¿Listo para digitalizar tu negocio?</h2>
          <p>
            Únete a miles de empresas que ya están vendiendo más con CatalogQR
          </p>
          <a href="#" className="primary-btn">
            Comenzar Ahora - Es Gratis
          </a>
        </div>
      </section>

      <footer>
        <div className="container">
          <p>&copy; 2025 CatalogQR. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

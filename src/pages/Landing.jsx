import { Link } from "react-router-dom";
import "../styles/landing.css";

function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="container">
          <h1>Catálogo QR</h1>
          <p>Crea tu catálogo online y compártelo con un código QR</p>
        </div>
      </header>

      <main className="landing-main">
        <div className="container">
          <section className="landing-hero">
            <h2>Perfecto para pequeños negocios</h2>
            <p>
              Crea un catálogo digital de tus productos, genera un código QR y
              compártelo con tus clientes. Ellos podrán ver tus productos y
              contactarte directamente por WhatsApp.
            </p>
            <div className="landing-actions">
              <Link to="/demo/catalog/mi-tienda" className="btn btn-primary">
                Ver catálogo demo
              </Link>
              <Link to="/demo/admin" className="btn btn-outline">
                Entrar al panel
              </Link>
            </div>
          </section>

          <section className="landing-features">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Fácil de usar</h3>
              <p>
                Interfaz simple e intuitiva. Agrega productos, categorías y
                personaliza tu catálogo en minutos.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Código QR</h3>
              <p>
                Genera automáticamente un código QR que enlaza a tu catálogo.
                Imprímelo y compártelo fácilmente.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>WhatsApp integrado</h3>
              <p>
                Los clientes pueden contactarte directamente por WhatsApp con
                información del producto que les interesa.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive</h3>
              <p>
                Tu catálogo se ve perfecto en cualquier dispositivo: móvil,
                tablet o computadora.
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2024 Catálogo QR. Hecho con ❤️ para pequeños negocios.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;

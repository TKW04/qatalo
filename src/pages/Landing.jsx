import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { LuBuilding2, LuFolderOpen, LuPackage } from "react-icons/lu";
import { IoQrCodeOutline } from "react-icons/io5";
import { FaWhatsapp, FaUsers } from "react-icons/fa";

import styles from "./Landing.module.css";
import { fetchPlans } from "../services/subscriptionApi";
import PlanCard from "../components/PlanCard";
import Navbar from "./Navbar";
import Footer from "../components/Footer";
import Button from "../components/PrimaryButton";

const Landing = () => {
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
    retry: false,
  });

  return (
    <>
      <div className={styles.navbarContainer}>
        <Navbar />
      </div>

      <div>
        <section className={styles.hero} id="home">
          <div className={styles.heroContent}>
            <h1>Tu Catálogo Digital con QR</h1>
            <p>
              Crea catálogos interactivos, conecta con WhatsApp y recibe pedidos
              directamente. Todo en una plataforma fácil de usar.
            </p>
            <div className={styles.heroCta}>
              <Link to="/register" className={`${styles.primaryBtn} ${styles.pulse}`}>
                Crear Mi Catálogo
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.features} id="features">
          <div className={styles.container}>
            <div className={styles.sectionTitle1}>
              <h2>Todo lo que necesitas para vender más</h2>
              <p>Una plataforma completa para digitalizar tu negocio</p>
            </div>

            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <LuBuilding2 size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Crea tu Empresa</h3>
                <p>Configura tu perfil empresarial con logo, información de contacto y datos de tu negocio en minutos.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <LuFolderOpen size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Organiza Categorías</h3>
                <p>Estructura tu catálogo con categorías personalizadas para que tus clientes encuentren fácilmente lo que buscan.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <LuPackage size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Gestiona Productos</h3>
                <p>Añade productos con fotos, descripciones, precios y variaciones. Todo desde una interfaz intuitiva.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <FaUsers size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Clientes</h3>
                <p>Administra la información de tus clientes y lleva un registro de sus pedidos y preferencias.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <IoQrCodeOutline size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Códigos QR</h3>
                <p>Genera códigos QR únicos para tu catálogo y compártelos en físico o digital para acceso instantáneo.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <FaWhatsapp size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Integración WhatsApp</h3>
                <p>Conecta tu WhatsApp Business y recibe pedidos directamente. Automatiza el proceso de ventas.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.howItWorks} id="howItWorks">
          <div className={styles.container}>
            <div className={styles.sectionTitleHowItWorks}>
              <h2>Cómo Funciona</h2>
              <p>En 4 simples pasos tendrás tu catálogo digital funcionando</p>
            </div>

            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <h3>Registra tu Empresa</h3>
                <p>Crea tu cuenta y configura los datos básicos de tu negocio</p>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <h3>Añade Productos</h3>
                <p>Crea categorías y sube tus productos con fotos y descripciones</p>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <h3>Genera tu QR</h3>
                <p>Obtén tu código QR personalizado y compártelo con tus clientes</p>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <h3>Recibe Pedidos</h3>
                <p>Los clientes escanean, seleccionan productos y te contactan vía WhatsApp</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.pricingSection} id="pricing">
          <h1 className={styles.sectionTitle}>Planes y Precios</h1>
          <div className={styles.grid}>
            {plans.map((plan) => (
              <PlanCard plan={plan} key={plan.price_id} />
            ))}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2>¿Listo para digitalizar tu negocio?</h2>
            <p>Únete y comienza a vender más con tu catálogo digital hoy mismo.</p>
            <div className={styles.heroCta}>
              <Button to="/register" variant="primary" isPulse={true}>
                Comenzar Ahora - Es Gratis
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Landing;
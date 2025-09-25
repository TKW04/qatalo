import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import {
  Building2,
  FolderOpen,
  Package,
  QrCode,
  MessageCircle,
  Menu,
  Users,
} from "lucide-react";
import { Image } from "primereact/image";

import "./Landing.css";

import { GetPlans } from "../store/payment-store/plan-actions";
import { useNotification } from "../components/UI/NotificationProvider";
import PlanCard from "../components/PlanCard";

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import LandingSidebar from "../components/LandingSideBar";
import { Link } from "react-router-dom";
import Navbar from "./NavBar";

const Landing = () => {
  const plans = useSelector((state) => state.plan.plans);
  const dispatch = useDispatch();
  const { showError } = useNotification();
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = window.innerWidth <= 768;
  const isIPad = window.innerWidth <= 1024 && window.innerWidth > 768;

  useEffect(() => {
    if (plans.length === 0) {
      dispatch(GetPlans(showError));
    }
  }, [dispatch, plans, showError]);
  return (
    <>
      <div
        class="flex align-items-center justify-content-start"
        style={{
          width: "100%",
          height: "100px",
          paddingTop: "20px",
          background:
            "linear-gradient(135deg, var(--color-navy) 0%, var(--color-blue) 100%)",
          color: "white",
          zIndex: 1001,
          marginBottom: "20px",
          marginTop: "0px",
          left: "0",
          top: "0",
          gap: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          position: "fixed",
        }}
      >
        <Navbar />
        {/* {!isMobile && !isIPad && (
          <>
            <div className="flex">
              <Image
                src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
                alt="CatalogQR Logo"
                width={130}
              />
            </div>
            <div className="flex grid" style={{width:"100%", marginTop:"10px"}}>
              <div className="col-1 align-items-center justify-content-center" >
                <a
                  href="#inicio"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    marginRight: "auto",
                    fontWeight: "bold",
                    fontSize: "24px",
                  }}
                >
                  Inicio
                </a>
              </div>
              <div className="col align-items-center justify-content-center">
                <a
                  href="#caracteristicas"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    marginRight: "auto",
                    fontWeight: "bold",
                    fontSize: "24px",
                  }}
                >
                  Características
                </a>
              </div>
              <div className="col-3 align-items-center justify-content-center">
                <a
                  href="#como-funciona"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    marginRight: "auto",
                    fontWeight: "bold",
                    fontSize: "24px",
                  }}
                >
                  Cómo Funciona
                </a>
              </div>
              <div className="col align-items-start justify-content-start">
                <a
                  href="#planes-precios"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    marginRight: "auto",
                    fontWeight: "bold",
                    fontSize: "24px",
                  }}
                >
                  Precios
                </a>
              </div>
              <div className="col-3 align-items-center justify-content-center">
                <a
                  href="/register"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    marginRight: "auto",
                    fontWeight: "bold",
                    fontSize: "24px",
                  }}
                >
                  Comenzar Gratis
                </a>
              </div>
              <div className="col align-items-center justify-content-center">
                <a
                  href="/login"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    marginRight: "auto",
                    fontWeight: "bold",
                    fontSize: "24px",
                  }}
                >
                  Iniciar Sesión
                </a>
              </div>
            </div>
          </>
        )}
        {(isMobile || isIPad) && (
          <>
            <div className="flex-auto flex align-items-center justify-content-start bg-primary font-bold  border-round">
              <div className="flex">
                <Image
                  src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
                  alt="CatalogQR Logo"
                  width={130}
                />
              </div>
            </div>
            <div className="flex-auto flex align-items-center justify-content-end bg-primary m-3 font-bold  border-round">
              <div className="flex">
                <a href="#">
                  <Menu
                    color="white"
                    size={40}
                    onClick={() => setShowMenu(!showMenu)}
                  />
                </a>
              </div>
            </div>
          </>
        )}
        {showMenu && (
          <LandingSidebar
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
          />
        )} */}
      </div>

      <div>
        <section className="hero" id="inicio">
          <div className="hero-content" style={{ paddingTop: "0px" }}>
            <h1>Tu Catálogo Digital con QR</h1>
            <p>
              Crea catálogos interactivos, conecta con WhatsApp y recibe pedidos
              directamente. Todo en una plataforma fácil de usar.
            </p>
            <div className="hero-cta">
              <a href="/register" className="primary-btn pulse">
                Crear Mi Catálogo
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
                  <Building2 size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Crea tu Empresa</h3>
                <p>
                  Configura tu perfil empresarial con logo, información de
                  contacto y datos de tu negocio en minutos.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FolderOpen
                    size={40}
                    style={{ color: "var(--color-navy)" }}
                  />
                </div>
                <h3>Organiza Categorías</h3>
                <p>
                  Estructura tu catálogo con categorías personalizadas para que
                  tus clientes encuentren fácilmente lo que buscan.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <Package size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Gestiona Productos</h3>
                <p>
                  Añade productos con fotos, descripciones, precios y
                  variaciones. Todo desde una interfaz intuitiva.
                </p>
              </div>

              <div className="feature-card ">
                <div className="feature-icon">
                  <Users size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Clientes</h3>
                <p>
                  Administra la información de tus clientes y lleva un registro
                  de sus pedidos y preferencias.
                </p>
              </div>

              <div className="feature-card ">
                <div className="feature-icon">
                  <QrCode size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Códigos QR</h3>
                <p>
                  Genera códigos QR únicos para tu catálogo y compártelos en
                  físico o digital para acceso instantáneo.
                </p>
              </div>

              <div className="feature-card ">
                <div className="feature-icon">
                  <MessageCircle
                    size={40}
                    style={{ color: "var(--color-navy)" }}
                  />
                </div>
                <h3>Integración WhatsApp</h3>
                <p>
                  Conecta tu WhatsApp Business y recibe pedidos directamente.
                  Automatiza el proceso de ventas.
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
                <p>
                  Crea tu cuenta y configura los datos básicos de tu negocio
                </p>
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
                  Los clientes escanean, seleccionan productos y te contactan
                  vía WhatsApp
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="pricing-section" id="planes-precios">
          <h1 className="section-title">Planes y Precios</h1>
          <div className="grid">
            {plans.map((plan) => (
              <PlanCard plan={plan} key={plan.price_id} />
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <h2>¿Listo para digitalizar tu negocio?</h2>
            <p>
              Únete y comienza a vender más con tu catálogo digital hoy mismo.
            </p>
            <a href="#" className="primary-btn">
              Comenzar Ahora - Es Gratis
            </a>
          </div>
        </section>

        <footer>
          <div className="container">
            <p>
              <Link
                to="/terms-and-conditions"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Términos y Condiciones
              </Link>
            </p>
            <p>&copy; 2025 Qatalo. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;

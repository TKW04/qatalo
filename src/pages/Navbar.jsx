import { useState } from "react";
import "./Navbar.css";

const Navbar = () => {
  const [abierto, setAbierto] = useState(false);
  const isMobile = window.innerWidth <= 760;

  return (
    <header className="nav" style={{paddingTop:"0px", marginTop:"0px",marginBottom:"0px"}}>
      <div className="nav__wrap">
        {/* Logo */}
        <a href="#inicio" className="nav__brand" aria-label="Qatalo Home">
          <img
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
            alt="CatalogQR Logo"
            width="130"
            height="auto"
            loading="lazy"
          />
        </a>

        {isMobile && (
          <button
            className="nav__toggle"
            aria-expanded={abierto}
            aria-controls="menu-principal"
            onClick={() => setAbierto((s) => !s)}
          >
            <span className="nav__sr-only">Abrir/cerrar menú</span>
            <span className="nav__bar" />
            <span className="nav__bar" />
            <span className="nav__bar" />
          </button>
        )}

        {/* Menú */}
        <nav
          id="menu-principal"
          className={`nav__menu ${abierto ? "is-open" : ""}`}
        >
          <a href="#inicio" className="nav__link">
            Inicio
          </a>
          <a href="#caracteristicas" className="nav__link">
            Características
          </a>
          <a href="#como-funciona" className="nav__link">
            Cómo Funciona
          </a>
          <a href="#planes-precios" className="nav__link">
            Precios
          </a>
          <a href="/register" className="primary-btn pulse">
            Comenzar Gratis
          </a>
          <a href="/login" className="nav__link">
            Iniciar Sesión
          </a>
        </nav>
      </div>
    </header>
  );
};
export default Navbar;

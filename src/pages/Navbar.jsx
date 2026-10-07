import { useEffect, useRef, useState } from "react";
import styles from "./Navbar.module.css";
import { Link } from "react-router-dom";
import { getTokenInfo } from "../helpers/token";

const LINKS = [
  { href: "/#home", label: "Inicio" },
  { href: "/#features", label: "Características" },
  { href: "/#howItWorks", label: "Cómo funciona" },
  { href: "/#pricing", label: "Planes" },
];

// Etiqueta única del CTA de registro (navbar, hero y CTA final)
export const SIGNUP_CTA = "Pruébalo gratis 15 días";

const MOBILE_BREAKPOINT = 960;

const Navbar = () => {
  const [abierto, setAbierto] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const isLogged = !!getTokenInfo()?.email;

  const cerrarMenu = () => setAbierto(false);

  // Escape para cerrar
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cerrar al volver a desktop
  useEffect(() => {
    const onResize = () => window.innerWidth > MOBILE_BREAKPOINT && setAbierto(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;
    const onClick = (e) => {
      if (menuRef.current?.contains(e.target) || toggleRef.current?.contains(e.target)) return;
      setAbierto(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [abierto]);

  // Bloquear scroll del fondo cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [abierto]);

  return (
    <header className={styles.nav}>
      <div className={styles.navWrap}>
        <a href="/#home" className={styles.navBrand} onClick={cerrarMenu}>
          <img
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
            alt="Qatalo"
            className={styles.logo}
            width="88"
            height="56"
          />
        </a>

        <button
          ref={toggleRef}
          type="button"
          className={`${styles.navToggle} ${abierto ? styles.isActive : ""}`}
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
          aria-controls="nav-menu"
        >
          <span className={styles.navBar} aria-hidden="true" />
          <span className={styles.navBar} aria-hidden="true" />
          <span className={styles.navBar} aria-hidden="true" />
        </button>

        <nav
          id="nav-menu"
          ref={menuRef}
          aria-label="Navegación principal"
          className={`${styles.navMenu} ${abierto ? styles.isOpen : ""}`}
        >
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={styles.navLink} onClick={cerrarMenu}>
              {l.label}
            </a>
          ))}

          {isLogged ? (
            <Link to="/admin" className={styles.navCta} onClick={cerrarMenu}>Ir al panel</Link>
          ) : (
            <>
              <a href="/login" className={styles.navLink} onClick={cerrarMenu}>Iniciar sesión</a>
              <Link to="/register" className={styles.navCta} onClick={cerrarMenu}>{SIGNUP_CTA}</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
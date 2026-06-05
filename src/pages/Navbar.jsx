import { useEffect, useRef, useState } from "react";
import styles from "./Navbar.module.css";
import PrimaryButton from "../components/PrimaryButton";
import { getTokenInfo } from "../helpers/token";

const LINKS = [
  { href: "/#home", label: "Inicio" },
  { href: "/#features", label: "Características" },
  { href: "/#howItWorks", label: "Cómo funciona" },
  { href: "/#pricing", label: "Planes" },
];

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
    const onResize = () => window.innerWidth > 760 && setAbierto(false);
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
          />
        </a>

        <button
          ref={toggleRef}
          className={`${styles.navToggle} ${abierto ? styles.isActive : ""}`}
          onClick={() => setAbierto((v) => !v)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          aria-controls="nav-menu"
        >
          <span className={styles.navBar} />
          <span className={styles.navBar} />
          <span className={styles.navBar} />
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
            <PrimaryButton to="/admin" variant="primary">Ir al panel</PrimaryButton>
          ) : (
            <>
              <a href="/login" className={styles.navLink} onClick={cerrarMenu}>Iniciar Sesión</a>
              <PrimaryButton to="/register" variant="primary">Comenzar Gratis</PrimaryButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
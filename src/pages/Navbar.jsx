import { useState } from "react";
import styles from "./Navbar.module.css";
import PrimaryButton from "../components/PrimaryButton"; // Ajusta la ruta

const Navbar = () => {
  const [abierto, setAbierto] = useState(false);

  const cerrarMenu = () => setAbierto(false);

  return (
    <header className={styles.nav}>
      <div className={styles.navWrap}>
        <a href="/#inicio" className={styles.navBrand} onClick={cerrarMenu}>
          <img
            src="https://qatalo.s3.us-east-1.amazonaws.com/qatalo.png"
            alt="Qatalo Logo"
            width="130"
            height="auto"
          />
        </a>

        <button
          className={`${styles.navToggle} ${abierto ? styles.isActive : ""}`}
          onClick={() => setAbierto(!abierto)}
          aria-label="Toggle menu"
          aria-expanded={abierto}
        >
          <span className={styles.navBar} />
          <span className={styles.navBar} />
          <span className={styles.navBar} />
        </button>

        <nav className={`${styles.navMenu} ${abierto ? styles.isOpen : ""}`}>
          <a href="/#home" className={styles.navLink} onClick={cerrarMenu}>
            Inicio
          </a>
          <a href="/#features" className={styles.navLink} onClick={cerrarMenu}>
            Características
          </a>
          <a href="/#howItWorks" className={styles.navLink} onClick={cerrarMenu}>
            Cómo funciona
          </a>
          <a href="/#pricing" className={styles.navLink} onClick={cerrarMenu}>
            Planes
          </a>
          <a href="/login" className={styles.navLink} onClick={cerrarMenu}>
            Iniciar Sesión
          </a>

          <PrimaryButton to="/register" variant="primary">
            Comenzar Gratis
          </PrimaryButton>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
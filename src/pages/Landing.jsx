import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { LuPackage, LuBell, LuChartNoAxesColumn, LuFileText } from "react-icons/lu";
import { IoQrCodeOutline } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";

import styles from "./Landing.module.css";
import { fetchPlans } from "../services/subscriptionApi";
import PlanCard from "../components/PlanCard";
import Navbar from "./Navbar";
import Footer from "../components/Footer";
import Button from "../components/PrimaryButton";

const Landing = () => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

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
        {/* ── HERO ── */}
        <section className={styles.hero} id="home">
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <h1>Deja de vender por fotos sueltas en WhatsApp</h1>
              <p>
                Con Qatalo tu negocio tiene su catálogo en línea con un solo enlace.
                Tus clientes ven todo, hacen su pedido y tú lo recibes ordenado.
                Sin comisiones por venta.
              </p>
              <div className={styles.heroCta}>
                <Link to="/register" className={`${styles.primaryBtn} ${styles.pulse}`}>
                  Pruébalo gratis 15 días
                </Link>
                <a href="/catalog/vivienne" className={styles.secondaryBtn}>
                  Ver catálogo de ejemplo
                </a>
              </div>
              <p className={styles.heroNote}>
                15 días gratis · No se te cobra hoy · Cancela cuando quieras
              </p>
            </div>

            {/* Mockup de teléfono con catálogo */}
            <div className={styles.heroMockup}>
              <div className={styles.phone}>
                <div className={styles.phoneNotch} />
                <div className={styles.phoneScreen}>
                  <div className={styles.demoHeader}>
                    <div className={styles.demoLogo}>B</div>
                    <div>
                      <div className={styles.demoName}>Boutique Vivienne</div>
                      <div className={styles.demoTag}>Moda femenina · RD</div>
                    </div>
                  </div>
                  <div className={styles.demoCats}>
                    <span className={styles.demoCatActive}>Todo</span>
                    <span className={styles.demoCat}>Vestidos</span>
                    <span className={styles.demoCat}>Blusas</span>
                  </div>
                  <div className={styles.demoGrid}>
                    <div className={styles.demoCard}>
                      <div className={styles.demoImg} data-c="1" />
                      <div className={styles.demoProd}>Vestido floral</div>
                      <div className={styles.demoPrice}>RD$ 1,850</div>
                    </div>
                    <div className={styles.demoCard}>
                      <div className={styles.demoImg} data-c="2" />
                      <div className={styles.demoProd}>Blusa de lino</div>
                      <div className={styles.demoPrice}>RD$ 980</div>
                    </div>
                    <div className={styles.demoCard}>
                      <div className={styles.demoImg} data-c="3" />
                      <div className={styles.demoProd}>Jeans alto</div>
                      <div className={styles.demoPrice}>RD$ 1,490</div>
                    </div>
                    <div className={styles.demoCard}>
                      <div className={styles.demoImg} data-c="4" />
                      <div className={styles.demoProd}>Falda midi</div>
                      <div className={styles.demoPrice}>RD$ 1,200</div>
                    </div>
                  </div>
                  <div className={styles.demoCartBar}>
                    <span>2 artículos</span>
                    <span className={styles.demoCartBtn}>Ver carrito · RD$ 2,830</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES (dolor → alivio) ── */}
        <section className={styles.features} id="features">
          <div className={styles.container}>
            <div className={styles.sectionTitle1}>
              <h2>Todo lo que necesitas para vender más</h2>
              <p>Tu negocio entero, ordenado en un solo lugar</p>
            </div>

            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <IoQrCodeOutline size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Un solo enlace para todo</h3>
                <p>
                  Se acabó mandar fotos una por una. Comparte tu enlace o tu código QR
                  y tus clientes ven todo tu inventario al instante, desde cualquier teléfono.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <LuPackage size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Recibe pedidos sin perder ninguno</h3>
                <p>
                  Cada pedido te llega ordenado: qué producto, cuánto, los datos del cliente.
                  Nada de buscar entre 200 mensajes para saber quién pidió qué.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <FaWhatsapp size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Conectado a tu WhatsApp</h3>
                <p>
                  Tus clientes te escriben directo con el pedido listo. Tú sigues
                  cerrando la venta donde ya estás cómodo, pero sin el desorden.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <LuFileText size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Facturas con NCF y recibos</h3>
                <p>
                  Genera comprobantes fiscales con NCF y el ITBIS calculado, o un recibo
                  simple, y envíalos al cliente por correo en un toque. Sin Excel, sin cálculos a mano.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <LuBell size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Nunca te quedes sin saber tu stock</h3>
                <p>
                  Te avisamos cuando un producto está por agotarse o cuando llega a cero,
                  para que reabastezcas a tiempo y no vendas lo que ya no tienes.
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <LuChartNoAxesColumn size={40} style={{ color: "var(--color-navy)" }} />
                </div>
                <h3>Sabe cómo va tu negocio</h3>
                <p>
                  Mira cuánto vendiste, qué productos se mueven más y qué clientes te compran.
                  Decisiones con datos, no con corazonadas. Y crea ofertas como 2x1 cuando quieras.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section className={styles.howItWorks} id="howItWorks">
          <div className={styles.container}>
            <div className={styles.sectionTitleHowItWorks}>
              <h2>Lo tienes funcionando hoy mismo</h2>
              <p>Sin programadores, sin complicaciones. Tú puedes solo.</p>
            </div>

            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <h3>Crea tu cuenta</h3>
                <p>Pones el nombre de tu negocio, tu logo y tus datos. Toma minutos.</p>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <h3>Sube tus productos</h3>
                <p>Fotos, precios y descripciones. ¿Tienes muchos? Los cargas todos de golpe desde un Excel.</p>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <h3>Comparte tu enlace</h3>
                <p>Recibes tu código QR y tu enlace. Lo pones en tu local, tu bio o tus estados.</p>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <h3>Empieza a recibir pedidos</h3>
                <p>Tus clientes escanean, eligen y te piden. Tú solo despachas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRECIOS ── */}
        <section className={styles.pricingSection} id="pricing">
          <div className={styles.sectionTitle1}>
            <h2>Un precio justo, sin sorpresas</h2>
            <p>Prueba 15 días gratis. No se te cobra hasta que termine la prueba, y cancelas cuando quieras.</p>
          </div>
          <div className={styles.grid}>
            {plans.map((plan) => (
              <PlanCard
                plan={plan}
                key={plan.price_id}
                showAll={showAllFeatures}
                onToggleShowAll={() => setShowAllFeatures((v) => !v)}
              />
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2>Tu competencia ya está en línea. Tú también puedes.</h2>
            <p>
              Monta tu catálogo esta misma tarde y empieza a recibir pedidos ordenados.
              Pruébalo 15 días gratis y cancela cuando quieras.
            </p>
            <div className={styles.heroCta}>
              <Button to="/register" variant="primary" isPulse={true}>
                Crear mi catálogo gratis
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
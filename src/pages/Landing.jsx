import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { LuPackage, LuBell, LuChartNoAxesColumn, LuFileText } from "react-icons/lu";
import { IoQrCodeOutline } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";

import styles from "./Landing.module.css";
import { fetchPlans } from "../services/subscriptionApi";
import PlanCard from "../components/PlanCard";
import Navbar, { SIGNUP_CTA } from "./Navbar";
import Footer from "../components/Footer";
import useInViewOnce from "../components/motion/useInViewOnce";
import { StrikeText, MarkText } from "../components/motion/StrikeMark";
import SplitReveal from "../components/motion/SplitReveal";
import Pipeline from "../components/motion/Pipeline";
import BillingToggle from "../components/motion/BillingToggle";

const SECONDARY_FEATURES = [
  {
    icon: LuPackage,
    title: "Recibe pedidos sin perder ninguno",
    text: "Cada pedido te llega ordenado: qué producto, cuánto, los datos del cliente. Nada de buscar entre 200 mensajes para saber quién pidió qué.",
  },
  {
    icon: FaWhatsapp,
    title: "Conectado a tu WhatsApp",
    text: "Tus clientes te escriben directo con el pedido listo. Tú sigues cerrando la venta donde ya estás cómodo, pero sin el desorden.",
  },
  {
    icon: LuFileText,
    title: "Facturas con NCF y recibos",
    text: "Genera comprobantes fiscales con NCF y el ITBIS calculado, o un recibo simple, y envíalos al cliente por correo en un toque. Sin Excel, sin cálculos a mano.",
  },
  {
    icon: LuBell,
    title: "Nunca te quedes sin saber tu stock",
    text: "Te avisamos cuando un producto está por agotarse o cuando llega a cero, para que reabastezcas a tiempo y no vendas lo que ya no tienes.",
  },
  {
    icon: LuChartNoAxesColumn,
    title: "Sabe cómo va tu negocio",
    text: "Mira cuánto vendiste, qué productos se mueven más y qué clientes te compran. Decisiones con datos, no con corazonadas. Y crea ofertas como 2x1 cuando quieras.",
  },
];

const STEPS = [
  { title: "Crea tu cuenta", text: "Pones el nombre de tu negocio, tu logo y tus datos. Toma minutos." },
  {
    title: "Sube tus productos",
    text: "Fotos, precios y descripciones. ¿Tienes muchos? Los cargas todos de golpe desde un Excel.",
  },
  {
    title: "Comparte tu enlace",
    text: "Recibes tu código QR y tu enlace. Lo pones en tu local, tu bio o tus estados.",
  },
  { title: "Empieza a recibir pedidos", text: "Tus clientes escanean, eligen y te piden. Tú solo despachas." },
];

const DEMO_PRODUCTS = [
  { name: "Vestido floral", price: "RD$ 1,850", tone: "1" },
  { name: "Blusa de lino", price: "RD$ 980", tone: "2" },
  { name: "Jeans alto", price: "RD$ 1,490", tone: "3" },
  { name: "Falda midi", price: "RD$ 1,200", tone: "4" },
];

// Agrupa precios de Paddle por producto y detecta si hay solo mensual + anual del mismo plan.
const usePricing = (plans) =>
  useMemo(() => {
    const groups = new Map();
    plans.forEach((p) => {
      const key = p.product_id || p.price_id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });

    const list = [...groups.entries()].map(([key, items]) => {
      const month = items.find((p) => p.billing_cycle === "month");
      const year = items.find((p) => p.billing_cycle === "year");
      let savingsPct = 0;
      if (month && year && Number(month.unit_price) > 0 && Number(year.unit_price) > 0) {
        savingsPct = Math.round((1 - Number(year.unit_price) / (12 * Number(month.unit_price))) * 100);
      }
      return { key, items, hasBoth: Boolean(month && year), savingsPct: savingsPct > 0 ? savingsPct : 0 };
    });

    // Toggle solo si cada plan tiene exactamente un precio mensual y uno anual. Si hay más
    // opciones (p. ej. Trimestral, que la API devuelve también como "month"), se muestran todas.
    const hasToggle = list.length > 0 && list.every((g) => g.hasBoth && g.items.length === 2);
    const pcts = [...new Set(list.map((g) => g.savingsPct).filter(Boolean))];
    const toggleSavings = pcts.length === 0
      ? null
      : pcts.length === 1
        ? `Ahorra ${pcts[0]}%`
        : `Ahorra hasta ${Math.max(...pcts)}%`;

    return { groups: list, hasToggle, toggleSavings };
  }, [plans]);

const Landing = () => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [cycle, setCycle] = useState("month");
  const [heroRef, heroPlay] = useInViewOnce({ threshold: 0.2 });

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
    retry: false,
  });
  const plans = Array.isArray(data) ? data : [];
  const { groups, hasToggle, toggleSavings } = usePricing(plans);

  const visiblePlans = hasToggle
    ? groups.map((g) => {
        const plan = g.items.find((p) => p.billing_cycle === cycle) || g.items[0];
        const savings = cycle === "year" && plan.billing_cycle === "year" && g.savingsPct
          ? `Ahorras ${g.savingsPct}%`
          : undefined;
        return { key: g.key, plan, savings };
      })
    : plans.map((plan) => ({ key: plan.price_id, plan, savings: undefined }));

  const toggleShowAll = () => setShowAllFeatures((v) => !v);

  const renderPricing = () => {
    if (isLoading) {
      return (
        <div className={styles.planGrid} aria-busy="true">
          <p role="status" className={styles.srOnly}>Cargando planes…</p>
          {[0, 1].map((i) => (
            <div key={i} className={styles.planSkeleton} aria-hidden="true">
              <span className={styles.skLine} style={{ width: "45%" }} />
              <span className={styles.skBlock} />
              <span className={styles.skLine} />
              <span className={styles.skLine} />
              <span className={styles.skLine} style={{ width: "70%" }} />
              <span className={styles.skLine} style={{ width: "80%" }} />
              <span className={styles.skButton} />
            </div>
          ))}
        </div>
      );
    }

    if (isError || plans.length === 0) {
      return (
        <div className={styles.pricingState} role={isError ? "alert" : "status"}>
          <p className={styles.pricingStateTitle}>
            {isError ? "No pudimos cargar los planes." : "Los planes no están disponibles en este momento."}
          </p>
          <p className={styles.pricingStateText}>
            {isError ? "Revisa tu conexión e inténtalo otra vez." : "Vuelve a intentarlo en unos minutos."} Mientras tanto, puedes empezar tu prueba gratis.
          </p>
          <div className={styles.pricingStateActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Cargando…" : "Reintentar"}
            </button>
            <Link to="/register" className={styles.primaryBtn}>{SIGNUP_CTA}</Link>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.planGrid}>
        {visiblePlans.map(({ key, plan, savings }) => (
          <PlanCard
            plan={plan}
            key={key}
            savings={savings}
            showAll={showAllFeatures}
            onToggleShowAll={toggleShowAll}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <main>
        {/* ── HERO ── */}
        <section className={styles.hero} id="home">
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroContent} ref={heroRef}>
              <h1 className={styles.heroTitle}>
                Deja de vender por <StrikeText play={heroPlay} delay={250}>fotos sueltas</StrikeText> en WhatsApp
              </h1>
              <p className={styles.heroLead}>
                Con Qatalo tu negocio tiene su catálogo en línea con{" "}
                <MarkText play={heroPlay} delay={760}>un solo enlace</MarkText>.
                Tus clientes ven todo, hacen su pedido y tú lo recibes ordenado.
                Sin comisiones por venta.
              </p>
              <div className={styles.heroCta}>
                <Link to="/register" className={styles.primaryBtn}>
                  {SIGNUP_CTA}
                </Link>
                <a href="/catalog/vivienne" className={styles.secondaryBtn}>
                  Ver catálogo de ejemplo
                </a>
              </div>
              <p className={styles.heroNote}>
                15 días gratis · No se te cobra hoy · Cancela cuando quieras
              </p>
            </div>

            {/* Mockup de teléfono con un catálogo de ejemplo (tema del negocio, no de Qatalo) */}
            <div className={styles.heroMockup}>
              <div
                className={styles.phone}
                role="img"
                aria-label="Ejemplo: catálogo de Boutique Vivienne abierto en un teléfono"
              >
                <div className={styles.phoneScreen} aria-hidden="true">
                  <div className={styles.phoneNotch} />
                  <div className={styles.demoHeader}>
                    <div className={styles.demoLogo}>B</div>
                    <div className={styles.demoHeaderText}>
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
                    {DEMO_PRODUCTS.map((p) => (
                      <div key={p.name} className={styles.demoCard}>
                        <div className={styles.demoImg} data-c={p.tone} />
                        <div className={styles.demoProd}>{p.name}</div>
                        <div className={styles.demoPrice}>{p.price}</div>
                      </div>
                    ))}
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

        {/* ── FEATURES ── */}
        <section className={styles.features} id="features">
          <div className={styles.container}>
            <header className={styles.sectionHead}>
              <SplitReveal as="h2" className={styles.sectionTitle}>
                Todo lo que necesitas para vender más
              </SplitReveal>
              <p className={styles.sectionLead}>Tu negocio entero, ordenado en un solo lugar</p>
            </header>

            <div className={styles.featureLayout}>
              <article className={styles.featureLead}>
                <IoQrCodeOutline className={styles.featureLeadIcon} aria-hidden="true" />
                <h3>Un solo enlace para todo</h3>
                <p>
                  Se acabó mandar fotos una por una. Comparte tu enlace o tu código QR
                  y tus clientes ven todo tu inventario al instante, desde cualquier teléfono.
                </p>
              </article>

              <ul className={styles.featureList}>
                {SECONDARY_FEATURES.map(({ icon, title, text }) => {
                  const Icon = icon;
                  return (
                  <li key={title} className={styles.featureItem}>
                    <Icon className={styles.featureIcon} aria-hidden="true" />
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section className={styles.howItWorks} id="howItWorks">
          <div className={styles.container}>
            <header className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Lo tienes funcionando hoy mismo</h2>
              <p className={styles.sectionLead}>Sin programadores, sin complicaciones. Tú puedes solo.</p>
            </header>

            <Pipeline steps={STEPS} />
          </div>
        </section>

        {/* ── PRECIOS ── */}
        <section className={styles.pricing} id="pricing">
          <div className={styles.container}>
            <header className={`${styles.sectionHead} ${styles.sectionHeadCenter}`}>
              <SplitReveal as="h2" className={styles.sectionTitle}>
                Un precio justo, sin sorpresas
              </SplitReveal>
              <p className={styles.sectionLead}>
                Prueba 15 días gratis. No se te cobra hasta que termine la prueba, y cancelas cuando quieras.
              </p>
            </header>

            {hasToggle && !isLoading && !isError && (
              <div className={styles.toggleRow}>
                <BillingToggle value={cycle} onChange={setCycle} savings={toggleSavings} />
              </div>
            )}

            {renderPricing()}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaPanel}>
              <SplitReveal as="h2" className={styles.ctaTitle}>
                Tu competencia ya está en línea. Tú también puedes.
              </SplitReveal>
              <p className={styles.ctaText}>
                Monta tu catálogo esta misma tarde y empieza a recibir pedidos ordenados.
                Pruébalo 15 días gratis y cancela cuando quieras.
              </p>
              <Link to="/register" className={styles.ctaBtn}>
                {SIGNUP_CTA}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;

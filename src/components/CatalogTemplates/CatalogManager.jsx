import { useState, useMemo, useEffect } from "react";
import TemplateDefault from "./TemplateDefault";
import TemplateFashion from "./TemplateFashion";
import TemplateTech from "./TemplateTech";
import TemplateCrafts from "./TemplateCrafts";
import TemplateFood from "./TemplateFood";
import TemplateAccessory from "./TemplateAccessory";
import ProductModal from "../ProductModal";
import { DUMMY_PRODUCTS, DUMMY_CATEGORIES } from "./previewData";
import CustomerAuthModal from "./CustomerAuthModal";
import CustomerOrders from "./CustomerOrders";
import CartDrawer from "./CartDrawer";
import { getCustomerSession, setCustomerSession, getValidCustomerSession, decodeCustomerToken, getCart, cartCount } from "../../services/customerAuthApi";
import portal from "./CustomerPortal.module.css";

const Templates = {
  default: TemplateDefault,
  fashion: TemplateFashion,
  tech: TemplateTech,
  crafts: TemplateCrafts,
  food: TemplateFood,
  accessory: TemplateAccessory,
};

const noop = () => { };

const parsePalette = (raw) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (typeof raw === "object") return raw;
  return {};
};

const CatalogManager = ({ businessData, products = [], categories: categoriesProp, isPreview = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocality, setSelectedLocality] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const usingDummy = isPreview && products.length === 0;
  const sourceProducts = usingDummy ? DUMMY_PRODUCTS : products;

  const businessId = businessData?.business_id;
  const [authOpen, setAuthOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  // fuerza re-lectura de la sesión tras login
  const [, setSessionTick] = useState(0);

  const openOrders = () => {
    if (getCustomerSession(businessId)?.token) setOrdersOpen(true);
    else setAuthOpen(true);
  };

  const [cartOpen, setCartOpen] = useState(false);
  const [cartCnt, setCartCnt] = useState(0);
  const refreshCart = () => setCartCnt(cartCount(getCart(businessId)));
  useEffect(() => { if (businessId) refreshCart(); }, [businessId]); // eslint-disable-line

  useEffect(() => {
    if (isPreview || !businessId) return;
    const m = window.location.hash.match(/orders-token=([^&]+)/);
    if (m) {
      const token = decodeURIComponent(m[1]);
      const payload = decodeCustomerToken(token);
      setCustomerSession(businessId, { token, email: payload?.email || "" });
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setOrdersOpen(true);
    }
  }, [businessId, isPreview]);

  // ── Inyección de scripts GA4 y Meta Pixel ──────────────────────────────────
  useEffect(() => {
    if (isPreview || !businessData) return;
    const { ga_tracking_id, meta_pixel_id } = businessData;

    // GA4
    if (ga_tracking_id && !document.getElementById("qa-ga4")) {
      const s1 = document.createElement("script");
      s1.id = "qa-ga4";
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${ga_tracking_id}`;
      document.head.appendChild(s1);

      const s2 = document.createElement("script");
      s2.id = "qa-ga4-init";
      s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga_tracking_id}');`;
      document.head.appendChild(s2);
    }

    // Meta Pixel
    if (meta_pixel_id && !document.getElementById("qa-meta")) {
      const s = document.createElement("script");
      s.id = "qa-meta";
      s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta_pixel_id}');fbq('track','PageView');`;
      document.head.appendChild(s);
    }
  }, [businessData?.ga_tracking_id, businessData?.meta_pixel_id, isPreview]);


  // ── Helper de tracking ─────────────────────────────────────────────────────
  const track = (gaEvent, fbEvent, params = {}) => {
    if (isPreview) return;
    if (window.gtag && businessData?.ga_tracking_id) window.gtag("event", gaEvent, params);
    if (window.fbq && businessData?.meta_pixel_id) window.fbq("track", fbEvent, params);
  };

  const categories = useMemo(() => {
    if (usingDummy) return DUMMY_CATEGORIES;
    if (categoriesProp && categoriesProp.length) return categoriesProp;
    return Array.from(
      new Map(
        sourceProducts
          .filter((p) => p.category_id)
          .map((p) => [p.category_id, { category_id: p.category_id, name: p.category_name || p.category_id }])
      ).values()
    );
  }, [usingDummy, categoriesProp, sourceProducts]);

  const localityOptions = useMemo(() => {
    if (businessData?.localities && businessData.localities.length) return businessData.localities;
    const set = new Set();
    sourceProducts.forEach((p) => (p.localities || []).forEach((l) => set.add(l)));
    return Array.from(set);
  }, [businessData, sourceProducts]);

  // Variables canónicas que TODOS los templates escuchan
  const palette = parsePalette(businessData?.themePalette);
  const themeStyles = {
    "--theme-primary": palette.primary,
    "--theme-secondary": palette.secondary,
    "--theme-accent": palette.accent,
    "--theme-background": palette.background,
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sourceProducts.filter((p) => {
      const matchesSearch = p.name?.toLowerCase().includes(term);
      const matchesCat = selectedCategory === "all" || p.category_id === selectedCategory;
      const locs = p.localities || [];
      const matchesLoc = selectedLocality === "all" || locs.includes(selectedLocality);
      return matchesSearch && matchesCat && matchesLoc;
    });
  }, [sourceProducts, searchTerm, selectedCategory, selectedLocality]);

  const SelectedTemplate = Templates[businessData?.templateId] || TemplateDefault;
  const handleProductClick = isPreview
    ? noop
    : (product) => {
      setSelectedProduct(product);
      track("view_item", "ViewContent", {
        item_name: product.name,
        value: Number(product.price) || 0,
        currency: product.currency || "",
      });
    };

  return (
    <div style={{ ...themeStyles, width: "100%", minHeight: "100%" }}>
      {localityOptions.length > 0 && (
        <div style={{
          background: "var(--theme-background, #f7fafc)",
          padding: ".75rem 1rem",
          display: "flex", justifyContent: "center", alignItems: "center", gap: ".6rem",
          borderBottom: "1px solid rgba(0,0,0,.06)",
        }}>
          <span style={{ fontSize: ".9rem", color: "var(--theme-secondary, #2d3e50)", fontWeight: 600 }}>Localidad:</span>
          <select
            value={selectedLocality}
            onChange={(e) => setSelectedLocality(e.target.value)}
            style={{ padding: ".45rem .8rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,.15)", background: "#fff", color: "#1d2939", fontWeight: 600, fontSize: "16px" }}
          >
            <option value="all">Todas</option>
            {localityOptions.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
          </select>
        </div>
      )}

      <SelectedTemplate
        business={businessData}
        products={filteredProducts}
        categories={categories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onProductClick={handleProductClick}
        onShare={noop}
      />

      {!isPreview && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          business={businessData}
          onClose={() => setSelectedProduct(null)}
          onAdded={() => { refreshCart(); setCartOpen(true); }}
          onOpenCart={() => {
            setSelectedProduct(null); {/* ← cierra el product modal */ }
            setCartOpen(true); {/* ← abre el cart */ }
          }}
          preselectedLocality={selectedLocality !== "all" ? selectedLocality : ""}  // ← nuevo
        />
      )}
      {cartOpen && (
        <CartDrawer
          businessId={businessId}
          businessName={businessData?.business_name || businessData?.name}
          onClose={() => { setCartOpen(false); refreshCart(); }}
          onChanged={refreshCart}
          onCheckoutStart={() =>
            track("begin_checkout", "InitiateCheckout", {})
          }
          onPurchase={({ total, currency }) =>
            track("purchase", "Purchase", { value: total, currency })
          }
        />
      )}

      {!isPreview && businessId && (
        <>
          <button className={portal.fab} onClick={openOrders}>Mis órdenes</button>
          <button className={portal.fabCart} onClick={() => setCartOpen(true)}>
            🛒{cartCnt > 0 && <span className={portal.fabBadge}>{cartCnt}</span>}
          </button>

          {authOpen && (
            <CustomerAuthModal
              businessId={businessId}
              businessName={businessData?.business_name || businessData?.name}
              onClose={() => setAuthOpen(false)}
              onSuccess={() => {
                setAuthOpen(false);
                setOrdersOpen(true);   // 👈 esto es lo que monta CustomerOrders y dispara fetchMyOrders
              }}
            />
          )}
          {ordersOpen && (
            <CustomerOrders
              businessId={businessId}
              onClose={() => setOrdersOpen(false)}
              onSessionExpired={() => {
                setOrdersOpen(false);
                setAuthOpen(true);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CatalogManager;
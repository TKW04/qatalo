import { useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { ChevronLeft, ChevronRight, MessageCircle, ShoppingCart, Check } from "lucide-react";
import { useNotification } from "./UI/NotificationProvider";
import {
  getCart, setCart, getValidCustomerSession, setCustomerSession, fetchMyOrders,
} from "../services/customerAuthApi";
import { formatted, formatTextDate } from "../helpers/utils";
import styles from "./ProductModal.module.css";

const toISO = (s) => {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) { let [, mm, dd, yy] = m; if (yy.length === 2) yy = "20" + yy; return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`; }
  return "";
};

const ProductModal = ({ product, business, onClose, onAdded }) => {
  const { showWarning } = useNotification();
  const productLocalities = product.localities || [];
  const noTerms = !product.terms;
  const images = (product.imagesUrl || []).map((i) => i.image).filter(Boolean);
  const [form, setForm] = useState({
    quantity: 1, delivery_day: "", acceptTerms: noTerms,
    locality: productLocalities.length === 1 ? productLocalities[0] : "",
  });
  const [step, setStep] = useState(null); // "cart" | null
  const [showTerms, setShowTerms] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, instanceRef] = useKeenSlider({ initial: 0, slideChanged: (s) => setCurrentSlide(s.track.details.rel) });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const maxQty = product.show_quantity ? product.quantity : 9999;

  const openWhatsApp = (who) => {
    const saludo = who ? `soy ${who}, ` : "";
    const msg = `Hola, ${saludo}estoy interesad@ en "${product.name}". Lo vi en tu catálogo: ${window.location.href}`;
    window.open(`https://wa.me/${(business.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const handleWhatsApp = async () => {
    const s = getValidCustomerSession(business.business_id);
    if (!s?.token) return openWhatsApp("");
    let name = s.full_name || `${s.given_name || ""} ${s.family_name || ""}`.trim();
    if (!name) {
      try {
        const c = await fetchMyOrders(business.business_id);
        name = c.full_name || `${c.given_name || ""} ${c.family_name || ""}`.trim();
        setCustomerSession(business.business_id, { ...s, given_name: c.given_name, family_name: c.family_name, full_name: c.full_name, email: c.email || s.email });
      } catch { /* sin nombre */ }
    }
    openWhatsApp(name);
  };

  const addToCart = () => {
    if (productLocalities.length > 0 && !form.locality) return showWarning("Aviso", "Selecciona tu localidad");
    if (product.required_delivery_day && !form.delivery_day) return showWarning("Aviso", "Selecciona la fecha de entrega");
    if (product.terms && !form.acceptTerms) return showWarning("Aviso", "Debes aceptar los términos");
    if (product.show_quantity && Number(form.quantity) > product.quantity) return showWarning("Aviso", "Excede el inventario disponible");

    const items = getCart(business.business_id);
    const idx = items.findIndex((i) => i.product_id === product.product_id && i.locality === form.locality && i.delivery_day === form.delivery_day);
    if (idx >= 0) items[idx].quantity = Number(items[idx].quantity || 0) + (Number(form.quantity) || 1);
    else items.push({
      product_id: product.product_id, product_name: product.name,
      price: Number(product.price) || 0, currency: product.currency,
      quantity: Number(form.quantity) || 1, locality: form.locality,
      delivery_day: form.delivery_day, accept_terms: !!form.acceptTerms, image: images[0] || "",
    });
    setCart(business.business_id, items);
    onAdded?.();
    onClose();
  };

  const overlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className={styles.overlay} onClick={overlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} aria-label="Cerrar">✕</button>

        <div className={styles.gallery}>
          {images.length > 0 ? (
            <>
              <div ref={sliderRef} className="keen-slider">
                {images.map((src, i) => (
                  <div className={`keen-slider__slide ${styles.slide}`} key={i}>
                    <img src={src} alt={product.name} className={styles.galleryImg} />
                  </div>
                ))}
              </div>
              {images.length > 1 && (
                <>
                  <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => instanceRef.current?.prev()}><ChevronLeft /></button>
                  <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => instanceRef.current?.next()}><ChevronRight /></button>
                  <div className={styles.dots}>
                    {images.map((_, i) => (
                      <span key={i} className={`${styles.dot} ${currentSlide === i ? styles.dotActive : ""}`} onClick={() => instanceRef.current?.moveToIdx(i)} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (<img src="/placeholder.svg" alt={product.name} className={styles.galleryImg} />)}
        </div>

        <div className={styles.body}>
          <h2 className={styles.title}>{product.name}</h2>
          <div className={styles.price}>{product.currency} {formatted(product.price)}</div>
          {product.description && <p className={styles.description}>{product.description}</p>}
          {product.show_quantity && product.quantity > 0 && (<div className={styles.stock}>Disponible: <strong>{product.quantity}</strong></div>)}
          {productLocalities.length > 0 && (<div className={styles.stock}>Disponible en: <strong>{productLocalities.join(", ")}</strong></div>)}
          <div className={styles.actions}>
            {product.is_available === "available" ? (
              <>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStep("cart")}><ShoppingCart size={18} /> Agregar al carrito</button>
                <button className={`${styles.btn} ${styles.btnWhats}`} onClick={handleWhatsApp}><MessageCircle size={18} /> WhatsApp</button>
              </>
            ) : (<button className={`${styles.btn} ${styles.btnDisabled}`} disabled>Producto agotado</button>)}
          </div>
        </div>
      </div>

      {step === "cart" && (
        <div className={styles.subOverlay} onClick={(e) => e.stopPropagation()}>
          <div className={styles.subModal}>
            <h3>Agregar al carrito</h3>
            {productLocalities.length > 0 && (
              <div className={styles.field}>
                <label>Localidad</label>
                <select className={styles.input} value={form.locality} onChange={(e) => set("locality", e.target.value)}>
                  <option value="">Selecciona tu localidad</option>
                  {productLocalities.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
                </select>
              </div>
            )}
            <div className={styles.field}>
              <label>Cantidad {product.show_quantity && <span>({product.quantity} disponibles)</span>}</label>
              <input type="number" className={styles.input} min={1} max={maxQty} disabled={product.just_one}
                value={form.quantity}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (product.show_quantity && v > product.quantity) return showWarning("Aviso", "Excede el inventario disponible");
                  set("quantity", v);
                }} />
            </div>
            {product.required_delivery_day && (
              <div className={styles.field}>
                <label>Fecha de entrega {product.delivery_start_day && <span>(a partir de {formatTextDate(product.delivery_start_day)})</span>}</label>
                <input type="date" className={styles.input} min={toISO(product.delivery_start_day)} value={form.delivery_day} onChange={(e) => set("delivery_day", e.target.value)} />
              </div>
            )}
            {product.terms && (
              <div className={styles.terms}>
                <button type="button" className={styles.termsLink} onClick={() => setShowTerms(true)}>Términos y condiciones</button>
                <label className={styles.checkbox}><input type="checkbox" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} /> Acepto</label>
              </div>
            )}
            <div className={styles.subActions}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStep(null)}>Cancelar</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={addToCart}><Check size={16} /> Agregar</button>
            </div>
          </div>
        </div>
      )}

      {showTerms && (
        <div className={styles.subOverlay} onClick={(e) => { e.stopPropagation(); setShowTerms(false); }}>
          <div className={styles.subModal} onClick={(e) => e.stopPropagation()}>
            <h3>Términos y condiciones</h3>
            <p className={styles.termsText}>{product.terms}</p>
            <div className={styles.subActions}><button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowTerms(false)}>Entendido</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductModal;
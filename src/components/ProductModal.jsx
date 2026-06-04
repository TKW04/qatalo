import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { ChevronLeft, ChevronRight, MessageCircle, ShoppingCart, Check } from "lucide-react";

import { useNotification } from "./UI/NotificationProvider";
import Loading from "./UI/Loading";
import { fetchPaymentMethodsByBusinessId } from "../services/paymentMethodsApi";
import { createCatalogOrder } from "../services/customersApi";
import { formatted, formatTextDate, getAges } from "../helpers/utils";
import styles from "./ProductModal.module.css";

const toISO = (s) => {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, mm, dd, yy] = m;
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return "";
};

const emptyForm = {
  given_name: "", family_name: "", email: "", phone: "", age: 0,
  quantity: 1, delivery_day: "", paymentMethodId: "", acceptTerms: false, locality: "",
};

const ProductModal = ({ product, business, onClose }) => {
  const { showWarning, showError } = useNotification();

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["public-payment-methods", business?.business_id],
    queryFn: () => fetchPaymentMethodsByBusinessId(business.business_id),
    enabled: !!business?.business_id,
    retry: false,
  });

  const noTerms = !product.terms;
  const productLocalities = product.localities || [];
  const [form, setForm] = useState({
    ...emptyForm,
    acceptTerms: noTerms,
    locality: productLocalities.length === 1 ? productLocalities[0] : "",
  });
  const [step, setStep] = useState(null); // "customer" | "buy" | "success"
  const [action, setAction] = useState("buy");
  const [showTerms, setShowTerms] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = (product.imagesUrl || []).map((i) => i.image).filter(Boolean);
  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0,
    slideChanged: (s) => setCurrentSlide(s.track.details.rel),
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const maxQty = product.show_quantity ? product.quantity : 9999;

  const order = useMutation({
    mutationFn: () => {
      const pm = paymentMethods.find((p) => p.payment_method_id === form.paymentMethodId);
      return createCatalogOrder({
        business_id: business.business_id,
        given_name: form.given_name,
        family_name: form.family_name,
        email: form.email,
        phone: form.phone,
        age: Number(form.age) || 0,
        transaction: {
          product_id: product.product_id,
          product_name: product.name,
          quantity: Number(form.quantity) || 1,
          price: Number(product.price) || 0,
          delivery_day: form.delivery_day,
          accept_terms: form.acceptTerms,
          locality: form.locality,
          payment_method: { payment_method_id: pm?.payment_method_id },
        },
      });
    },
    onSuccess: () => setStep("success"),
    onError: (e) => showError("Error", e.message || "No se pudo crear la orden"),
  });

  const startFlow = (act) => { setAction(act); setStep("customer"); };

  const handleWhatsApp = () => {
    const msg = `Hola, soy ${form.given_name} ${form.family_name}, estoy interesad@ en "${product.name}". Lo vi en tu catálogo: ${window.location.href}`;
    window.open(`https://wa.me/${(business.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const continueFromCustomer = () => {
    if (!form.given_name.trim() || !form.family_name.trim()) return showWarning("Aviso", "Nombre y apellido requeridos");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return showWarning("Aviso", "Correo inválido");
    if (product.min_age_allow) {
      const age = Number(form.age);
      if (!age) return showWarning("Aviso", "Selecciona una edad válida");
      if (age < parseInt(product.min_age)) return showWarning("Aviso", `La edad mínima es ${product.min_age} años`);
    }
    if (action === "whatsapp") { handleWhatsApp(); setStep(null); return; }
    setStep("buy");
  };

  const canBuy = useMemo(() => {
    if (!form.paymentMethodId) return false;
    if (!form.quantity || Number(form.quantity) < 1) return false;
    if (!form.acceptTerms) return false;
    if (product.required_delivery_day && !form.delivery_day) return false;
    if (productLocalities.length > 0 && !form.locality) return false;
    return true;
  }, [form, product, productLocalities]);

  const overlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className={styles.overlay} onClick={overlay}>
      <Loading visible={order.isPending} message="Creando solicitud..." />

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
          ) : (
            <img src="/placeholder.svg" alt={product.name} className={styles.galleryImg} />
          )}
        </div>

        <div className={styles.body}>
          <h2 className={styles.title}>{product.name}</h2>
          <div className={styles.price}>{product.currency} {formatted(product.price)}</div>
          {product.description && <p className={styles.description}>{product.description}</p>}
          {product.show_quantity && product.quantity > 0 && (
            <div className={styles.stock}>Disponible: <strong>{product.quantity}</strong></div>
          )}
          {productLocalities.length > 0 && (
            <div className={styles.stock}>Disponible en: <strong>{productLocalities.join(", ")}</strong></div>
          )}
          <div className={styles.actions}>
            {product.is_available === "available" ? (
              <>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => startFlow("buy")}><ShoppingCart size={18} /> Comprar</button>
                <button className={`${styles.btn} ${styles.btnWhats}`} onClick={() => startFlow("whatsapp")}><MessageCircle size={18} /> WhatsApp</button>
              </>
            ) : (
              <button className={`${styles.btn} ${styles.btnDisabled}`} disabled>Producto agotado</button>
            )}
          </div>
        </div>
      </div>

      {step === "customer" && (
        <div className={styles.subOverlay} onClick={(e) => e.stopPropagation()}>
          <div className={styles.subModal}>
            <h3>Tus datos</h3>
            <div className={styles.field}><label>Nombre</label><input className={styles.input} value={form.given_name} onChange={(e) => set("given_name", e.target.value)} placeholder="Juan" /></div>
            <div className={styles.field}><label>Apellido</label><input className={styles.input} value={form.family_name} onChange={(e) => set("family_name", e.target.value)} placeholder="Pérez" /></div>
            <div className={styles.field}><label>Correo</label><input className={styles.input} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="juan@ejemplo.com" /></div>
            <div className={styles.field}><label>Teléfono</label><input className={styles.input} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="8095551234" /></div>
            {product.min_age_allow && (
              <div className={styles.field}><label>Edad</label>
                <select className={styles.input} value={form.age} onChange={(e) => set("age", e.target.value)}>
                  <option value={0}>Seleccionar edad</option>
                  {getAges().map((a) => (<option key={a.code ?? a.name} value={a.code ?? a.name}>{a.name}</option>))}
                </select>
              </div>
            )}
            <div className={styles.subActions}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStep(null)}>Cancelar</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={continueFromCustomer}><Check size={16} /> Continuar</button>
            </div>
          </div>
        </div>
      )}

      {step === "buy" && (
        <div className={styles.subOverlay} onClick={(e) => e.stopPropagation()}>
          <div className={styles.subModal}>
            <h3>Detalles de la orden</h3>
            {productLocalities.length > 0 && (
              <div className={styles.field}>
                <label>Localidad</label>
                <select className={styles.input} value={form.locality} onChange={(e) => set("locality", e.target.value)}>
                  <option value="">Selecciona tu localidad</option>
                  {productLocalities.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
                </select>
              </div>
            )}
            <div className={styles.field}><label>Método de pago</label>
              <select className={styles.input} value={form.paymentMethodId} onChange={(e) => set("paymentMethodId", e.target.value)}>
                <option value="">Selecciona un método</option>
                {paymentMethods.map((pm) => (<option key={pm.payment_method_id} value={pm.payment_method_id}>{pm.payment_method_name}</option>))}
              </select>
            </div>
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
                <label className={styles.checkbox}>
                  <input type="checkbox" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} /> Acepto
                </label>
              </div>
            )}
            <div className={styles.subActions}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStep(null)}>Cancelar</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={!canBuy || order.isPending} onClick={() => order.mutate()}><Check size={16} /> Confirmar pedido</button>
            </div>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className={styles.subOverlay} onClick={(e) => e.stopPropagation()}>
          <div className={styles.subModal}>
            <h3>¡Solicitud enviada!</h3>
            <p className={styles.successText}>Tu solicitud se envió con éxito. En breve recibirás una notificación por correo. Si no la ves, revisa tu carpeta de <strong>spam o promociones</strong>.</p>
            <p className={styles.successText}>¡Gracias por tu preferencia!</p>
            <div className={styles.subActions}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showTerms && (
        <div className={styles.subOverlay} onClick={(e) => { e.stopPropagation(); setShowTerms(false); }}>
          <div className={styles.subModal} onClick={(e) => e.stopPropagation()}>
            <h3>Términos y condiciones</h3>
            <p className={styles.termsText}>{product.terms}</p>
            <div className={styles.subActions}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowTerms(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductModal;
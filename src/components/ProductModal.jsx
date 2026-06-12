import { useEffect, useMemo, useState } from "react";
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

const ProductModal = ({ product, business, onClose, onAdded, preselectedLocality = "" }) => {
  const { showWarning } = useNotification();
  const productLocalities = product.localities || [];
  const noTerms = !product.terms;
  const images = (product.imagesUrl || []).map((i) => i.image).filter(Boolean);

  const [form, setForm] = useState({
    quantity: 1, delivery_day: "", acceptTerms: noTerms,
    locality: (() => {
      // Si hay un filtro activo Y el producto lo incluye → pre-llenar
      if (preselectedLocality && productLocalities.includes(preselectedLocality)) return preselectedLocality;
      // Si el producto solo tiene una localidad → pre-llenar
      if (productLocalities.length === 1) return productLocalities[0];
      return "";
    })(),
    fulfillment_type: "",
  });
  const [step, setStep] = useState(null); // null | "cart"
  const [showTerms, setShowTerms] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Variant state
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0, slideChanged: (s) => setCurrentSlide(s.track.details.rel),
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Variant computations
  const availableColors = useMemo(() => {
    if (!product.is_customizable || !product.variants) return [];
    return [...new Set(product.variants.filter((v) => v.quantity > 0).map((v) => v.color))];
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!selectedColor || !product.variants) return [];
    return product.variants.filter((v) => v.color === selectedColor && v.quantity > 0).map((v) => v.size).filter(Boolean);
  }, [selectedColor, product]);

  const selectedVariant = useMemo(() => {
    if (!product.is_customizable || !selectedColor || !product.variants) return null;
    return product.variants.find((v) => v.color === selectedColor && (!v.size || v.size === selectedSize)) || null;
  }, [selectedColor, selectedSize, product]);

  const displayPrice = useMemo(() => {
    if (product.is_customizable && selectedVariant) return Number(product.price) + Number(selectedVariant.extra_price || 0);
    return Number(product.price);
  }, [product, selectedVariant]);

  const lowestPrice = useMemo(() => {
    if (!product.is_customizable || !product.variants?.length) return Number(product.price);
    return Math.min(...product.variants.map((v) => Number(product.price) + Number(v.extra_price || 0)));
  }, [product]);

  const variantMaxQty = selectedVariant ? selectedVariant.quantity : (!product.is_customizable && product.show_quantity ? product.quantity : 9999);

  // Config de entrega para la localidad seleccionada
  const localityConfig = useMemo(() => {
    if (!form.locality || !product.locality_config?.length) return null;
    return product.locality_config.find((c) => c.locality === form.locality) || null;
  }, [form.locality, product]);

  const hasDelivery = !!localityConfig?.delivery;
  const hasTakeout = !!localityConfig?.takeout;
  const deliveryPrice = form.fulfillment_type === "delivery" ? (Number(localityConfig?.delivery_price) || 0) : 0;


  // Auto-selección cuando solo hay una opción
  useEffect(() => {
    if (!localityConfig) { set("fulfillment_type", ""); return; }
    if (hasDelivery && !hasTakeout) set("fulfillment_type", "delivery");
    else if (!hasDelivery && hasTakeout) set("fulfillment_type", "takeout");
    else set("fulfillment_type", "");
  }, [localityConfig]); // eslint-disable-line
  // WhatsApp
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
    // Variant validation
    if (product.is_customizable) {
      if (!selectedColor || availableColors.length === 0) return showWarning("Aviso", "Selecciona un color");
      if (availableSizes.length > 0 && !selectedSize) return showWarning("Aviso", "Selecciona una talla");
      if (!selectedVariant) return showWarning("Aviso", "Variante no disponible");
      if (Number(form.quantity) > selectedVariant.quantity) return showWarning("Aviso", `Stock disponible: ${selectedVariant.quantity}`);
    }
    if (productLocalities.length > 0 && !form.locality) return showWarning("Aviso", "Selecciona tu localidad");
    if (product.required_delivery_day && !form.delivery_day) return showWarning("Aviso", "Selecciona la fecha de entrega");
    if (product.terms && !form.acceptTerms) return showWarning("Aviso", "Debes aceptar los términos");
    if (!product.is_customizable && product.show_quantity && Number(form.quantity) > product.quantity)
      return showWarning("Aviso", "Excede el inventario disponible");

    const items = getCart(business.business_id);
    const variantLabel = product.is_customizable && selectedVariant
      ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ")
      : "";
    const itemPrice = displayPrice;

    // Merge if same product+variant+locality+delivery_day
    const matchKey = `${product.product_id}|${variantLabel}|${form.locality}|${form.delivery_day}`;
    const idx = items.findIndex((i) => `${i.product_id}|${i.variant_label || ""}|${i.locality}|${i.delivery_day}` === matchKey);
    if (idx >= 0) {
      items[idx].quantity = Number(items[idx].quantity || 0) + Number(form.quantity || 1);
    } else {
      items.push({
        product_id: product.product_id,
        product_name: product.name,
        price: itemPrice,
        currency: product.currency,
        quantity: Number(form.quantity) || 1,
        locality: form.locality,
        delivery_day: form.delivery_day,
        accept_terms: !!form.acceptTerms,
        image: images[0] || "",
        fulfillment_type: form.fulfillment_type || (hasDelivery ? "delivery" : hasTakeout ? "takeout" : ""), // ← nuevo
        delivery_price: deliveryPrice,  // ← nuevo
        ...(product.is_customizable && selectedVariant ? {
          variant: { variant_id: selectedVariant.variant_id, color: selectedVariant.color, size: selectedVariant.size || "" },
          variant_label: variantLabel,
        } : {}),
      });
    }
    setCart(business.business_id, items);
    onAdded?.();
    onClose();
  };

  const canAdd = useMemo(() => {
    if (product.is_customizable) {
      if (!selectedColor || availableColors.length === 0) return false;
      if (availableSizes.length > 0 && !selectedSize) return false;
      if (!selectedVariant || selectedVariant.quantity < 1) return false;
    }
    if (localityConfig && hasDelivery && hasTakeout && !form.fulfillment_type) return false; // ← nuevo
    if (productLocalities.length > 0 && !form.locality) return false;
    if (product.required_delivery_day && !form.delivery_day) return false;
    if (product.terms && !form.acceptTerms) return false;
    if (!form.quantity || Number(form.quantity) < 1) return false;
    return true;
  }, [form, product, productLocalities, selectedColor, selectedSize, selectedVariant, availableSizes, availableColors, localityConfig, hasDelivery, hasTakeout]);

  const overlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className={styles.overlay} onClick={overlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} aria-label="Cerrar">✕</button>

        {/* Gallery */}
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
                    {images.map((_, i) => <span key={i} className={`${styles.dot} ${currentSlide === i ? styles.dotActive : ""}`} onClick={() => instanceRef.current?.moveToIdx(i)} />)}
                  </div>
                </>
              )}
            </>
          ) : (<img src="/placeholder.svg" alt={product.name} className={styles.galleryImg} />)}
        </div>

        {/* Product info */}
        <div className={styles.body}>
          <h2 className={styles.title}>{product.name}</h2>
          <div className={styles.price}>
            {product.is_customizable && product.variants?.some((v) => v.extra_price > 0)
              ? `Desde ${product.currency} ${formatted(lowestPrice)}`
              : `${product.currency} ${formatted(product.price)}`}
          </div>
          {product.description && <p className={styles.description}>{product.description}</p>}
          {!product.is_customizable && product.show_quantity && product.quantity > 0 && (
            <div className={styles.stock}>Disponible: <strong>{product.quantity}</strong></div>
          )}
          {product.is_customizable && <div className={styles.stock}>Selecciona color y talla para ver disponibilidad.</div>}
          {productLocalities.length > 0 && <div className={styles.stock}>Disponible en: <strong>{productLocalities.join(", ")}</strong></div>}

          <div className={styles.actions}>
            {product.is_available === "available" ? (
              <>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStep("cart")}>
                  <ShoppingCart size={18} /> Agregar al carrito
                </button>
                <button className={`${styles.btn} ${styles.btnWhats}`} onClick={handleWhatsApp}>
                  <MessageCircle size={18} /> WhatsApp
                </button>
              </>
            ) : (
              <button className={`${styles.btn} ${styles.btnDisabled}`} disabled>Producto agotado</button>
            )}
          </div>
        </div>
      </div>

      {/* Cart step */}
      {step === "cart" && (
        <div className={styles.subOverlay} onClick={(e) => e.stopPropagation()}>
          <div className={styles.subModal}>
            <h3>Agregar al carrito</h3>

            {/* Variant selectors */}
            {product.is_customizable && (
              <>
                <div className={styles.variantGroup}>
                  <div className={styles.variantLabel}>Color *</div>
                  {availableColors.length === 0 ? (
                    <p className={styles.noStock}>Sin stock disponible</p>
                  ) : (
                    <div className={styles.pills}>
                      {availableColors.map((c) => (
                        <button type="button" key={c}
                          className={`${styles.pill} ${selectedColor === c ? styles.pillActive : ""}`}
                          onClick={() => { setSelectedColor(c); setSelectedSize(""); set("quantity", 1); }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedColor && availableSizes.length > 0 && (
                  <div className={styles.variantGroup}>
                    <div className={styles.variantLabel}>Talla *</div>
                    <div className={styles.pills}>
                      {availableSizes.map((s) => (
                        <button type="button" key={s}
                          className={`${styles.pill} ${selectedSize === s ? styles.pillActive : ""}`}
                          onClick={() => { setSelectedSize(s); set("quantity", 1); }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVariant && (
                  <div className={styles.variantInfo}>
                    <span>Disponible: <strong>{selectedVariant.quantity}</strong></span>
                    {selectedVariant.extra_price > 0 && (
                      <span>Precio: <strong>{product.currency} {formatted(displayPrice)}</strong></span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Locality */}
            {productLocalities.length > 0 && (
              <div className={styles.field}>
                <label>Localidad</label>
                <select className={styles.input} value={form.locality} onChange={(e) => set("locality", e.target.value)}>
                  <option value="">Selecciona tu localidad</option>
                  {productLocalities.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
            )}
            {/* Tipo de entrega */}
            {localityConfig && (hasDelivery || hasTakeout) && (
              <div className={styles.field}>
                <label>Tipo de entrega</label>
                {hasDelivery && hasTakeout ? (
                  <div className={styles.fulfillmentGroup}>
                    <label className={`${styles.fulfillmentOption} ${form.fulfillment_type === "delivery" ? styles.fulfillmentActive : ""}`}>
                      <input type="radio" name="fulfillment" value="delivery"
                        checked={form.fulfillment_type === "delivery"}
                        onChange={() => set("fulfillment_type", "delivery")} />
                      <span>🛵 Delivery {Number(localityConfig.delivery_price) > 0 ? `(+${product.currency} ${formatted(localityConfig.delivery_price)})` : "(gratis)"}</span>
                    </label>
                    <label className={`${styles.fulfillmentOption} ${form.fulfillment_type === "takeout" ? styles.fulfillmentActive : ""}`}>
                      <input type="radio" name="fulfillment" value="takeout"
                        checked={form.fulfillment_type === "takeout"}
                        onChange={() => set("fulfillment_type", "takeout")} />
                      <span>🏪 Recoger en tienda</span>
                    </label>
                  </div>
                ) : (
                  <div className={styles.fulfillmentInfo}>
                    {hasDelivery
                      ? `🛵 Delivery ${Number(localityConfig.delivery_price) > 0 ? `(+${product.currency} ${formatted(localityConfig.delivery_price)})` : "(gratis)"}`
                      : "🏪 Recoger en tienda"}
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className={styles.field}>
              <label>Cantidad {product.show_quantity && !product.is_customizable && <span>({product.quantity} disponibles)</span>}
                {product.is_customizable && selectedVariant && <span>({selectedVariant.quantity} disponibles)</span>}
              </label>
              <input type="number" className={styles.input} min={1} max={variantMaxQty}
                disabled={product.just_one || (product.is_customizable && !selectedVariant)}
                value={form.quantity}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v > variantMaxQty) return showWarning("Aviso", `Stock disponible: ${variantMaxQty}`);
                  set("quantity", v);
                }} />
            </div>

            {/* Delivery day */}
            {product.required_delivery_day && (
              <div className={styles.field}>
                <label>Fecha de entrega {product.delivery_start_day && <span>(a partir de {formatTextDate(product.delivery_start_day)})</span>}</label>
                <input type="date" className={styles.input} min={toISO(product.delivery_start_day)} value={form.delivery_day} onChange={(e) => set("delivery_day", e.target.value)} />
              </div>
            )}

            {/* Terms */}
            {product.terms && (
              <div className={styles.terms}>
                <button type="button" className={styles.termsLink} onClick={() => setShowTerms(true)}>Términos y condiciones</button>
                <label className={styles.checkbox}><input type="checkbox" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} /> Acepto</label>
              </div>
            )}

            <div className={styles.subActions}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setStep(null)}>Cancelar</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={!canAdd} onClick={addToCart}>
                <Check size={16} /> Agregar
              </button>
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
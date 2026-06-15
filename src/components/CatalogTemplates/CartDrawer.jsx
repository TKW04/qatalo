import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Plus, Minus, Check, Tag, X } from "lucide-react";
import { useNotification } from "../UI/NotificationProvider";
import { fetchPaymentMethodsByBusinessId } from "../../services/paymentMethodsApi";
import { fetchPublicOffers } from "../../services/offersApi";
import {
  getCart, setCart, clearCart,
  getValidCustomerSession, getCustomerSession,
  getCustomerMode, setCustomerMode, getGuestInfo, setGuestInfo,
  checkoutCartWithToken,
} from "../../services/customerAuthApi";
import { createCatalogCart } from "../../services/customersApi";
import { currencies, formatted } from "../../helpers/utils";
import CustomerAuthModal from "./CustomerAuthModal";
import styles from "./CustomerPortal.module.css";

const symbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";

// ── Offer helpers ──────────────────────────────────────────────
const getApplicableItems = (offer, items) => {
  if (!offer) return [];
  if (offer.applies_to === "all") return items;
  if (offer.applies_to === "products")
    return items.filter(it => (offer.product_ids || []).includes(it.product_id));
  if (offer.applies_to === "categories")
    return items.filter(it => (offer.category_ids || []).includes(it.category_id || ""));
  return [];
};

const isOfferApplicable = (offer, items, subtotal) => {
  if ((offer.min_order_amount || 0) > 0 && subtotal < offer.min_order_amount) return false;
  return getApplicableItems(offer, items).length > 0;
};

const calcDiscount = (offer, items) => {
  if (!offer) return 0;
  const applicable = getApplicableItems(offer, items);
  if (!applicable.length) return 0;
  const sub = applicable.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0
  );
  return offer.discount_type === "percentage"
    ? sub * ((Number(offer.discount_value) || 0) / 100)
    : Math.min(Number(offer.discount_value) || 0, sub);
};

// Distribuye el descuento proporcionalmente por ítem aplicable
const distributeDiscount = (offer, items, totalDiscount) => {
  if (totalDiscount <= 0 || !offer)
    return items.map(it => ({ ...it, original_price: it.price, discount_amount: 0 }));
  const applicable = getApplicableItems(offer, items);
  const appSub = applicable.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0
  );
  return items.map(it => {
    const isApp = applicable.some(a => a.product_id === it.product_id);
    if (!isApp) return { ...it, original_price: it.price, discount_amount: 0 };
    const itemTotal = (Number(it.price) || 0) * (Number(it.quantity) || 1);
    const proportion = appSub > 0 ? itemTotal / appSub : 0;
    const itemTotalDiscount = totalDiscount * proportion;
    const dpUnit = itemTotalDiscount / (Number(it.quantity) || 1);
    return {
      ...it,
      original_price: it.price,
      discount_amount: itemTotalDiscount,  // total descuento de esta línea
      price: Math.max(0, Number(it.price) - dpUnit), // precio unitario descontado
    };
  });
};

// ── Componente ────────────────────────────────────────────────
const CartDrawer = ({ businessId, businessName, onClose, onChanged }) => {
  const { showWarning, showError } = useNotification();
  const [items, setItems] = useState(() => getCart(businessId));
  const [step, setStep] = useState("cart");
  const [session, setSession] = useState(() => getValidCustomerSession(businessId));
  const [selectedPm, setSelectedPm] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const savedGuest = getGuestInfo(businessId) || {};
  const [guest, setGuest] = useState({
    given_name: savedGuest.given_name || "",
    family_name: savedGuest.family_name || "",
    email: savedGuest.email || "",
    phone: savedGuest.phone || "",
    age: savedGuest.age || 0,
  });

  // Offer state
  const [promoCode, setPromoCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  const cur = symbol(items[0]?.currency);

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["public-payment-methods", businessId],
    queryFn: () => fetchPaymentMethodsByBusinessId(businessId),
    enabled: !!businessId, retry: false,
  });

  const { data: availableOffers = [] } = useQuery({
    queryKey: ["public-offers", businessId],
    queryFn: () => fetchPublicOffers(businessId),
    enabled: !!businessId, retry: false, staleTime: 1000 * 60 * 5,
  });

  // ── Totales ──
  const productsSubtotal = items.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0
  );
  const deliverySubtotal = items.reduce((s, it) => s + (Number(it.delivery_price) || 0), 0);
  const discountAmount = calcDiscount(appliedOffer, items);
  const total = productsSubtotal + deliverySubtotal - discountAmount;
  const hasDelivery = items.some(it => it.fulfillment_type === "delivery");

  // ── Auto-aplicar ofertas automáticas ──
  useEffect(() => {
    const auto = availableOffers.filter(o => o.trigger === "automatic");
    let best = null, bestD = 0;
    for (const o of auto) {
      if (!isOfferApplicable(o, items, productsSubtotal)) continue;
      const d = calcDiscount(o, items);
      if (d > bestD) { bestD = d; best = o; }
    }
    // Solo reemplaza si no hay un código manual activo
    if (!appliedOffer || appliedOffer.trigger === "automatic") {
      setAppliedOffer(best);
      setPromoSuccess(best ? `⚡ "${best.name}" aplicado automáticamente.` : "");
    }
  }, [availableOffers, items.length, productsSubtotal]); // eslint-disable-line

  // ── Helpers de carrito ──
  const persist = (next) => { setItems(next); setCart(businessId, next); onChanged?.(); };
  const changeQty = (i, delta) =>
    persist(items.map((it, idx) => idx === i ? { ...it, quantity: Math.max(1, Number(it.quantity || 1) + delta) } : it));
  const removeItem = (i) => {
    const next = items.filter((_, idx) => idx !== i);
    persist(next);
    if (!next.length) setStep("cart");
  };

  // ── Código promo ──
  const applyPromoCode = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    const offer = availableOffers.find(o => o.trigger === "code" && o.code === code);
    if (!offer) {
      setPromoError("Código no válido o expirado.");
      setPromoSuccess(""); return;
    }
    if (!isOfferApplicable(offer, items, productsSubtotal)) {
      setPromoError(
        (offer.min_order_amount || 0) > 0
          ? `Este código requiere un pedido mínimo de ${cur} ${formatted(offer.min_order_amount)}.`
          : "Este código no aplica a los productos en tu carrito."
      );
      setPromoSuccess(""); return;
    }
    const d = calcDiscount(offer, items);
    if (d <= 0) {
      setPromoError("Este código no aplica a los productos en tu carrito.");
      setPromoSuccess(""); return;
    }
    setAppliedOffer(offer);
    setPromoError("");
    setPromoSuccess(
      `✓ "${offer.name}" — ${offer.discount_type === "percentage"
        ? `${offer.discount_value}% off`
        : `${cur} ${formatted(d)} off`}`
    );
  };

  const removeOffer = () => {
    setAppliedOffer(null); setPromoCode("");
    setPromoError(""); setPromoSuccess("");
  };

  const goCheckout = () => {
    if (!items.length) return showWarning("Aviso", "Tu carrito está vacío");
    const s = getValidCustomerSession(businessId);
    if (s?.token) { setSession(s); setStep("pay"); }
    else if (getCustomerMode(businessId) === "guest") setStep("guest");
    else setStep("identity");
  };

  const continueGuest = () => {
    if (!guest.given_name.trim() || !guest.family_name.trim())
      return showWarning("Aviso", "Nombre y apellido requeridos");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email))
      return showWarning("Aviso", "Correo inválido");
    setGuestInfo(businessId, { ...guest, given_name: guest.given_name.trim(), family_name: guest.family_name.trim(), email: guest.email.trim() });
    setStep("pay");
  };

  const offerInfo = appliedOffer
    ? { offer_id: appliedOffer.offer_id, offer_name: appliedOffer.name, offer_code: appliedOffer.code || "" }
    : {};

  // ── Checkout ──
  const checkout = useMutation({
    mutationFn: () => {
      if (!selectedPm) throw new Error("Selecciona un método de pago");
      if (hasDelivery && !deliveryAddress.trim())
        throw new Error("La dirección de entrega es requerida");
      const itemsD = distributeDiscount(appliedOffer, items, discountAmount);
      const itemsFinal = itemsD.map(it => ({
        ...it,
        delivery_address: it.fulfillment_type === "delivery" ? deliveryAddress.trim() : "",
      }));
      if (session?.token) return checkoutCartWithToken(businessId, selectedPm, itemsFinal, offerInfo);
      return createCatalogCart({
        business_id: businessId,
        given_name: guest.given_name,
        family_name: guest.family_name,
        email: guest.email,
        phone: guest.phone,
        age: Number(guest.age) || 0,
        payment_method: { payment_method_id: selectedPm },
        items: itemsFinal,
        ...offerInfo,
      });
    },
    onSuccess: () => { clearCart(businessId); onChanged?.(); setStep("success"); },
    onError: (e) => showError("Error", e.message || "No se pudo crear la orden"),
  });

  console.log(paymentMethods);


  // ── Render ──
  return (
    <div className={styles.portal} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Cerrar">×</button>

        {/* Cart */}
        {step === "cart" && (
          <>
            <h2 className={styles.title}>Tu carrito</h2>
            {items.length === 0 ? (
              <p className={styles.empty}>Tu carrito está vacío.</p>
            ) : (
              <>
                <div className={styles.list}>
                  {items.map((it, i) => (
                    <div key={`${it.product_id}-${i}`} className={styles.cartItem}>
                      {it.image
                        ? <img src={it.image} alt="" className={styles.cartThumb} />
                        : <div className={styles.cartThumb} />}
                      <div className={styles.cartInfo}>
                        <div className={styles.productName}>{it.product_name}</div>
                        {it.variant_label && <div className={styles.variantTag}>{it.variant_label}</div>}
                        {it.fulfillment_type && (
                          <div className={styles.fulfillmentTag}>
                            {it.fulfillment_type === "delivery" ? "🛵 Delivery" : "🏪 Take out"}
                            {it.delivery_price > 0 && ` (+${cur} ${formatted(it.delivery_price)})`}
                          </div>
                        )}
                        <div className={styles.meta}>
                          {it.locality ? `${it.locality} · ` : ""}{cur} {formatted(it.price)} c/u
                        </div>
                        <div className={styles.qtyCtrl}>
                          <button onClick={() => changeQty(i, -1)} aria-label="Menos"><Minus size={14} /></button>
                          <span>{it.quantity}</span>
                          <button onClick={() => changeQty(i, +1)} aria-label="Más"><Plus size={14} /></button>
                          <button className={styles.trash} onClick={() => removeItem(i)} aria-label="Quitar"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <div className={styles.cartSub}>{cur} {formatted(it.price * it.quantity)}</div>
                    </div>
                  ))}
                </div>

                {/* Código promo */}
                <div className={styles.promoSection}>
                  {(!appliedOffer || appliedOffer.trigger === "automatic") && (
                    <div className={styles.promoRow}>
                      <input
                        className={styles.promoInput}
                        placeholder="Código de descuento"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === "Enter" && applyPromoCode()}
                      />
                      <button className={styles.promoBtn} onClick={applyPromoCode}>
                        <Tag size={14} /> Aplicar
                      </button>
                    </div>
                  )}
                  {promoError && <p className={styles.promoError}>{promoError}</p>}
                  {promoSuccess && (
                    <div className={styles.promoSuccess}>
                      <span>{promoSuccess}</span>
                      {appliedOffer?.trigger === "code" && (
                        <button className={styles.promoRemove} onClick={removeOffer} aria-label="Quitar"><X size={14} /></button>
                      )}
                    </div>
                  )}
                </div>

                {/* Totales */}
                <div className={styles.cartTotal}><span>Subtotal</span><strong>{cur} {formatted(productsSubtotal)}</strong></div>
                {discountAmount > 0 && (
                  <div className={`${styles.cartTotal} ${styles.discountLine}`}>
                    <span>🎁 Descuento{appliedOffer ? ` (${appliedOffer.name})` : ""}</span>
                    <strong>− {cur} {formatted(discountAmount)}</strong>
                  </div>
                )}
                {deliverySubtotal > 0 && (
                  <div className={styles.cartTotal}><span>🛵 Delivery</span><strong>{cur} {formatted(deliverySubtotal)}</strong></div>
                )}
                <div className={styles.cartTotal} style={{ borderTop: "2px solid #eef0f3", paddingTop: ".75rem", marginTop: ".25rem" }}>
                  <span><strong>Total</strong></span><strong>{cur} {formatted(total)}</strong>
                </div>

                <button className={styles.primaryBtn} onClick={goCheckout}>Proceder al pago</button>
              </>
            )}
          </>
        )}

        {/* Identity */}
        {step === "identity" && (
          <>
            <h2 className={styles.title}>¿Ya compraste aquí antes?</h2>
            <p className={styles.lead}>Inicia sesión para no repetir tus datos, o continúa como nuevo.</p>
            <button className={styles.primaryBtn} onClick={() => setStep("auth")}>Ya he comprado, iniciar sesión</button>
            <button className={styles.linkBtn} onClick={() => { setCustomerMode(businessId, "guest"); setStep("guest"); }}>Soy cliente nuevo</button>
          </>
        )}

        {/* Guest */}
        {step === "guest" && (
          <>
            <h2 className={styles.title}>Tus datos</h2>
            <label className={styles.label}>Nombre</label>
            <input className={styles.input} value={guest.given_name} onChange={e => setGuest({ ...guest, given_name: e.target.value })} />
            <label className={styles.label}>Apellido</label>
            <input className={styles.input} value={guest.family_name} onChange={e => setGuest({ ...guest, family_name: e.target.value })} />
            <label className={styles.label}>Correo</label>
            <input className={styles.input} type="email" value={guest.email} onChange={e => setGuest({ ...guest, email: e.target.value })} />
            <label className={styles.label}>Teléfono</label>
            <input className={styles.input} value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} />
            <button className={styles.primaryBtn} onClick={continueGuest}>Continuar</button>
            <button className={styles.linkBtn} onClick={() => setStep("cart")}>Volver al carrito</button>
          </>
        )}

        {/* Pay */}
        {step === "pay" && (
          <>
            <h2 className={styles.title}>Método de pago</h2>
            <p className={styles.lead}>
              Total: <strong>{cur} {formatted(total)}</strong>
              {discountAmount > 0 && <span style={{ color: "#067647", fontSize: ".82rem" }}> (incluye {cur} {formatted(discountAmount)} de descuento)</span>}
            </p>
            {hasDelivery && (
              <div style={{ marginBottom: "1rem" }}>
                <label className={styles.label}>📍 Dirección de entrega *</label>
                <textarea className={styles.input} rows={3} value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Calle, número, sector, ciudad…" />
              </div>
            )}
            <div className={styles.list}>
              {paymentMethods.length === 0 ? (
                <p style={{ color: "#b42318", fontSize: ".88rem", padding: ".75rem", background: "#fff1f2", borderRadius: "8px" }}>
                  ⚠️ Este negocio aún no tiene métodos de pago configurados.
                </p>
              ) : (
                paymentMethods.map(pm => (
                  <label key={pm.payment_method_id} className={`${styles.payOption} ${selectedPm === pm.payment_method_id ? styles.payOptionActive : ""}`}>
                    <input type="radio" name="pm" value={pm.payment_method_id}
                      checked={selectedPm === pm.payment_method_id}
                      onChange={() => setSelectedPm(pm.payment_method_id)} />
                    <span>{pm.payment_method_name}</span>
                  </label>
                ))
              )}

            </div>
            <button className={styles.primaryBtn} disabled={!selectedPm || checkout.isPending} onClick={() => checkout.mutate()}>
              {checkout.isPending ? "Enviando…" : <><Check size={16} /> Confirmar pedido</>}
            </button>
            <button className={styles.linkBtn} onClick={() => setStep("cart")}>Volver al carrito</button>
          </>
        )}

        {step === "success" && (
          <>
            <h2 className={styles.title}>¡Pedido enviado!</h2>
            <p className={styles.lead}>Recibirás un correo con el resumen y las instrucciones de pago.</p>
            <button className={styles.primaryBtn} onClick={onClose}>Cerrar</button>
          </>
        )}
      </div>

      {step === "auth" && (
        <CustomerAuthModal
          businessId={businessId}
          businessName={businessName}
          onClose={() => setStep("identity")}
          onSuccess={() => { setSession(getCustomerSession(businessId)); setStep("pay"); }}
        />
      )}
    </div>
  );
};

export default CartDrawer;
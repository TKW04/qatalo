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

// Prioridad como numero para comparar (mayor gana)
const PRIORITY_RANK = { alta: 3, media: 2, baja: 1 };
const priorityRank = (offer) => PRIORITY_RANK[(offer?.priority || "media").toLowerCase()] || 2;

// -- Offer helpers --
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

  if (offer.discount_type === "buy_x_get_y") {
    const X = Number(offer.buy_quantity) || 0;
    const Y = Number(offer.paid_quantity) || 0;
    if (X < 2 || Y < 1 || Y >= X) return 0;

    let total = 0;
    for (const it of applicable) {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      const bloques = Math.floor(qty / X);
      const gratisPorBloque = X - Y;
      const unidadesGratis = bloques * gratisPorBloque;
      total += unidadesGratis * price;
    }
    return total;
  }

  const sub = applicable.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0
  );
  return offer.discount_type === "percentage"
    ? sub * ((Number(offer.discount_value) || 0) / 100)
    : Math.min(Number(offer.discount_value) || 0, sub);
};

// -- Elegir la oferta GANADORA entre una lista de candidatas --
// Regla: mayor prioridad gana; si empatan, mayor descuento para el cliente. No se suman.
const pickWinningOffer = (candidates, items, subtotal) => {
  let winner = null, winnerDiscount = 0;
  for (const o of candidates) {
    if (!isOfferApplicable(o, items, subtotal)) continue;
    const d = calcDiscount(o, items);
    if (d <= 0) continue;
    if (!winner) { winner = o; winnerDiscount = d; continue; }
    const pr = priorityRank(o), pw = priorityRank(winner);
    if (pr > pw || (pr === pw && d > winnerDiscount)) {
      winner = o; winnerDiscount = d;
    }
  }
  return { winner, discount: winnerDiscount };
};

// Distribuye el descuento proporcionalmente por item aplicable
const distributeDiscount = (offer, items, totalDiscount) => {
  if (totalDiscount <= 0 || !offer)
    return items.map(it => ({ ...it, original_price: it.price, discount_amount: 0 }));

  const applicable = getApplicableItems(offer, items);

  if (offer.discount_type === "buy_x_get_y") {
    const X = Number(offer.buy_quantity) || 0;
    const Y = Number(offer.paid_quantity) || 0;
    return items.map(it => {
      const isApp = applicable.some(a => a.product_id === it.product_id);
      if (!isApp || X < 2 || Y < 1) return { ...it, original_price: it.price, discount_amount: 0 };
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      const bloques = Math.floor(qty / X);
      const unidadesGratis = bloques * (X - Y);
      const lineDiscount = unidadesGratis * price;
      const dpUnit = qty > 0 ? lineDiscount / qty : 0;
      return {
        ...it,
        original_price: it.price,
        discount_amount: lineDiscount,
        price: Math.max(0, price - dpUnit),
      };
    });
  }

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
      discount_amount: itemTotalDiscount,
      price: Math.max(0, Number(it.price) - dpUnit),
    };
  });
};

// -- Componente --
const CartDrawer = ({
  businessId, businessName, onClose, onChanged, onCheckoutStart, onPurchase, }) => {
  const { showWarning, showError } = useNotification();
  const [items, setItems] = useState(() => getCart(businessId));

  useEffect(() => {
    setItems(getCart(businessId));
  }, [businessId]);


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

  // Telefono confirmado para ordenes con link de pago
  const [confirmPhone, setConfirmPhone] = useState("");

  // Offer state
  const [promoCode, setPromoCode] = useState("");
  const [enteredCode, setEnteredCode] = useState(null);  // oferta de codigo ingresada (valida)
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [promoInfo, setPromoInfo] = useState("");        // aviso: ya tienes una oferta mejor

  const [stockError, setStockError] = useState(null);

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

  // Metodo seleccionado y si es link de pago
  const selectedMethod = paymentMethods.find(pm => pm.payment_method_id === selectedPm) || null;
  const isPaymentLink = selectedMethod?.payment_type === "payment_link";

  // -- Totales --
  const productsSubtotal = items.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0
  );
  const deliverySubtotal = items.reduce((s, it) => s + (Number(it.delivery_price) || 0), 0);
  const discountAmount = calcDiscount(appliedOffer, items);
  const total = productsSubtotal + deliverySubtotal - discountAmount;
  const hasDelivery = items.some(it => it.fulfillment_type === "delivery");

  // -- Recalcular oferta ganadora cuando cambian carrito, ofertas o el codigo ingresado --
  useEffect(() => {
    const auto = availableOffers.filter(o => o.trigger === "automatic");
    const candidates = enteredCode ? [...auto, enteredCode] : auto;
    const { winner } = pickWinningOffer(candidates, items, productsSubtotal);
    setAppliedOffer(winner);

    if (winner) {
      if (enteredCode && winner.offer_id === enteredCode.offer_id) {
        const d = calcDiscount(winner, items);
        setPromoSuccess(
          `✓ "${winner.name}" — ${winner.discount_type === "percentage"
            ? `${winner.discount_value}% off`
            : `${cur} ${formatted(d)} off`}`
        );
        setPromoInfo("");
      } else if (enteredCode) {
        setPromoSuccess(winner.trigger === "automatic" ? `⚡ "${winner.name}" aplicado automáticamente.` : "");
        setPromoInfo(`Ya tienes aplicada una oferta mejor: "${winner.name}". La mantenemos para que ahorres más.`);
      } else {
        setPromoSuccess(winner.trigger === "automatic" ? `⚡ "${winner.name}" aplicado automáticamente.` : "");
        setPromoInfo("");
      }
    } else {
      setPromoSuccess("");
      setPromoInfo("");
    }
  }, [availableOffers, items, productsSubtotal, enteredCode]); // eslint-disable-line

  // -- Helpers de carrito --
  const persist = (next) => { setItems(next); setCart(businessId, next); onChanged?.(); };
  const changeQty = (i, delta) =>
    persist(items.map((it, idx) => idx === i ? { ...it, quantity: Math.max(1, Number(it.quantity || 1) + delta) } : it));
  const removeItem = (i) => {
    const next = items.filter((_, idx) => idx !== i);
    persist(next);
    if (!next.length) setStep("cart");
  };

  // -- Codigo promo --
  const applyPromoCode = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    const offer = availableOffers.find(o => o.trigger === "code" && o.code === code);
    if (!offer) {
      setPromoError("Código no válido o expirado.");
      return;
    }
    if (!isOfferApplicable(offer, items, productsSubtotal)) {
      setPromoError(
        (offer.min_order_amount || 0) > 0
          ? `Este código requiere un pedido mínimo de ${cur} ${formatted(offer.min_order_amount)}.`
          : "Este código no aplica a los productos en tu carrito."
      );
      return;
    }
    const d = calcDiscount(offer, items);
    if (d <= 0) {
      setPromoError("Este código no aplica a los productos en tu carrito.");
      return;
    }
    setPromoError("");
    setEnteredCode(offer);
  };

  const removeOffer = () => {
    setEnteredCode(null);
    setPromoCode("");
    setPromoError("");
    setPromoInfo("");
  };

  const goCheckout = () => {
    setStockError(null);
    if (!items.length) return showWarning("Aviso", "Tu carrito está vacío");
    onCheckoutStart?.();
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

  // -- Checkout --
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
      const phoneToUse = (confirmPhone || guest.phone || "").trim();
      if (session?.token)
        return checkoutCartWithToken(businessId, selectedPm, itemsFinal, { ...offerInfo, confirmed_phone: phoneToUse });
      return createCatalogCart({
        business_id: businessId,
        given_name: guest.given_name,
        family_name: guest.family_name,
        email: guest.email,
        phone: phoneToUse,
        age: Number(guest.age) || 0,
        payment_method: { payment_method_id: selectedPm },
        items: itemsFinal,
        ...offerInfo,
      });
    },
    onSuccess: () => {
      onPurchase?.({
        total,
        currency: items[0]?.payment_method?.currency || "",
      }); clearCart(businessId); onChanged?.();
      setStep(isPaymentLink ? "successLink" : "success");
    },
    onError: (e) => {
      const body = e?.response?.data || {};
      if (body.error === "stock_insuficiente") {
        setStockError(
          `"${body.product_name}" solo tiene ${body.available} unidad${body.available !== 1 ? "es" : ""} disponible${body.available !== 1 ? "s" : ""}.`
        );
        setStep("cart");
      } else if (body.error === "producto_no_disponible") {
        setStockError(`"${body.product_name}" ya no está disponible.`);
        setStep("cart");
      } else {
        showError("Error", e.message || "No se pudo crear la orden");
      }
    },
  });

  const handleConfirm = () => {
    if (!selectedPm) return showWarning("Aviso", "Selecciona un método de pago");
    if (hasDelivery && !deliveryAddress.trim())
      return showWarning("Aviso", "La dirección de entrega es requerida");
    if (isPaymentLink) {
      setConfirmPhone(prev => prev || guest.phone || session?.phone || "");
      setStep("confirmPhone");
      return;
    }
    checkout.mutate();
  };

  const handleConfirmPhone = () => {
    const phone = confirmPhone.trim();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10)
      return showWarning("Aviso", "Ingresa un número de teléfono válido (con WhatsApp)");
    checkout.mutate();
  };

  const showPromoInput = !enteredCode;

  // -- Render --
  return (
    <div className={styles.portal} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Cerrar">×</button>

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

                <div className={styles.promoSection}>
                  {showPromoInput && (
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
                      {enteredCode && (
                        <button className={styles.promoRemove} onClick={removeOffer} aria-label="Quitar"><X size={14} /></button>
                      )}
                    </div>
                  )}
                  {promoInfo && <p className={styles.promoInfo}>{promoInfo}</p>}
                </div>

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
                {stockError && (
                  <div className={styles.stockErrorBanner}>
                    ⚠️ {stockError}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {step === "identity" && (
          <>
            <h2 className={styles.title}>¿Ya compraste aquí antes?</h2>
            <p className={styles.lead}>Inicia sesión para no repetir tus datos, o continúa como nuevo.</p>
            <button className={styles.primaryBtn} onClick={() => setStep("auth")}>Ya he comprado, iniciar sesión</button>
            <button className={styles.linkBtn} onClick={() => { setCustomerMode(businessId, "guest"); setStep("guest"); }}>Soy cliente nuevo</button>
          </>
        )}

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

            {isPaymentLink && (
              <div className={styles.payLinkNote}>
                💬 El negocio te enviará un link de pago por el monto exacto de tu pedido.
                En el siguiente paso confirma tu número de WhatsApp.
              </div>
            )}

            <button className={styles.primaryBtn} disabled={!selectedPm || checkout.isPending} onClick={handleConfirm}>
              {checkout.isPending ? "Enviando…" : <><Check size={16} /> {isPaymentLink ? "Continuar" : "Confirmar pedido"}</>}
            </button>
            <button className={styles.linkBtn} onClick={() => setStep("cart")}>Volver al carrito</button>
          </>
        )}

        {step === "confirmPhone" && (
          <>
            <h2 className={styles.title}>Confirma tu WhatsApp</h2>
            <p className={styles.lead}>
              El negocio te enviará el link de pago por WhatsApp por el total de{" "}
              <strong>{cur} {formatted(total)}</strong>. Confirma tu número para recibirlo.
            </p>
            <label className={styles.label}>Número de WhatsApp *</label>
            <input
              className={styles.input}
              value={confirmPhone}
              onChange={e => setConfirmPhone(e.target.value)}
              placeholder="Ej. 809 555 1234"
              inputMode="tel"
            />
            <button className={styles.primaryBtn} disabled={checkout.isPending} onClick={handleConfirmPhone}>
              {checkout.isPending ? "Enviando…" : <><Check size={16} /> Confirmar pedido</>}
            </button>
            <button className={styles.linkBtn} onClick={() => setStep("pay")}>Volver</button>
          </>
        )}

        {step === "success" && (
          <>
            <h2 className={styles.title}>¡Pedido enviado!</h2>
            <p className={styles.lead}>Recibirás un correo con el resumen y las instrucciones de pago.</p>
            <button className={styles.primaryBtn} onClick={onClose}>Cerrar</button>
          </>
        )}

        {step === "successLink" && (
          <>
            <h2 className={styles.title}>¡Pedido recibido! 🎉</h2>
            <p className={styles.lead}>
              El negocio te enviará el <strong>link de pago por WhatsApp</strong> por el monto
              exacto de tu pedido ({cur} {formatted(total)}). Mantente atento a tu WhatsApp.
            </p>
            <button className={styles.primaryBtn} onClick={onClose}>Entendido</button>
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
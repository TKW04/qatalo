import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Plus, Minus, Check } from "lucide-react";
import { useNotification } from "../UI/NotificationProvider";
import { fetchPaymentMethodsByBusinessId } from "../../services/paymentMethodsApi";
import {
  getCart, setCart, clearCart, cartTotal,
  getValidCustomerSession, getCustomerSession,
  getCustomerMode, setCustomerMode, getGuestInfo, setGuestInfo,
  checkoutCartWithToken,
} from "../../services/customerAuthApi";
import { createCatalogCart } from "../../services/customersApi";
import { currencies, formatted } from "../../helpers/utils";
import CustomerAuthModal from "./CustomerAuthModal";
import styles from "./CustomerPortal.module.css";

const symbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";

const CartDrawer = ({ businessId, businessName, onClose, onChanged }) => {
  const { showWarning, showError } = useNotification();
  const [items, setItems] = useState(() => getCart(businessId));
  const [step, setStep] = useState("cart"); // cart | identity | auth | guest | pay | success
  const [session, setSession] = useState(() => getValidCustomerSession(businessId));
  const [selectedPm, setSelectedPm] = useState("");
  const savedGuest = getGuestInfo(businessId) || {};
  const [guest, setGuest] = useState({
    given_name: savedGuest.given_name || "", family_name: savedGuest.family_name || "",
    email: savedGuest.email || "", phone: savedGuest.phone || "", age: savedGuest.age || 0,
  });

  const cur = symbol(items[0]?.currency);
  const total = cartTotal(items);

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["public-payment-methods", businessId],
    queryFn: () => fetchPaymentMethodsByBusinessId(businessId),
    enabled: !!businessId,
    retry: false,
  });

  const persist = (next) => { setItems(next); setCart(businessId, next); onChanged?.(); };
  const changeQty = (i, delta) => {
    const next = items.map((it, idx) => idx === i ? { ...it, quantity: Math.max(1, Number(it.quantity || 1) + delta) } : it);
    persist(next);
  };
  const removeItem = (i) => {
    const next = items.filter((_, idx) => idx !== i);
    persist(next);
    if (next.length === 0) setStep("cart");
  };

  const goCheckout = () => {
    if (!items.length) return showWarning("Aviso", "Tu carrito está vacío");
    const s = getValidCustomerSession(businessId);
    if (s?.token) { setSession(s); setStep("pay"); }
    else if (getCustomerMode(businessId) === "guest") setStep("guest");
    else setStep("identity");
  };

  const continueGuest = () => {
    if (!guest.given_name.trim() || !guest.family_name.trim()) return showWarning("Aviso", "Nombre y apellido requeridos");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) return showWarning("Aviso", "Correo inválido");
    setGuestInfo(businessId, { ...guest, given_name: guest.given_name.trim(), family_name: guest.family_name.trim(), email: guest.email.trim() });
    setStep("pay");
  };

  const checkout = useMutation({
    mutationFn: () => {
      if (!selectedPm) throw new Error("Selecciona un método de pago");
      if (session?.token) return checkoutCartWithToken(businessId, selectedPm, items);
      return createCatalogCart({
        business_id: businessId,
        given_name: guest.given_name, family_name: guest.family_name,
        email: guest.email, phone: guest.phone, age: Number(guest.age) || 0,
        payment_method: { payment_method_id: selectedPm }, items,
      });
    },
    onSuccess: () => { clearCart(businessId); onChanged?.(); setStep("success"); },
    onError: (e) => showError("Error", e.message || "No se pudo crear la orden"),
  });

  return (
    <div className={styles.portal} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
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
                      {it.image ? <img src={it.image} alt="" className={styles.cartThumb} /> : <div className={styles.cartThumb} />}
                      <div className={styles.cartInfo}>
                        <div className={styles.productName}>{it.product_name}</div>
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
                <div className={styles.cartTotal}><span>Total</span><strong>{cur} {formatted(total)}</strong></div>
                <button className={styles.primaryBtn} onClick={goCheckout}>Proceder al pago</button>
              </>
            )}
          </>
        )}

        {step === "identity" && (
          <>
            <h2 className={styles.title}>¿Ya compraste aquí antes?</h2>
            <p className={styles.lead}>Inicia sesión y no tendrás que escribir tus datos, o continúa como cliente nuevo.</p>
            <button className={styles.primaryBtn} onClick={() => setStep("auth")}>Ya he comprado, iniciar sesión</button>
            <button className={styles.linkBtn} onClick={() => { setCustomerMode(businessId, "guest"); setStep("guest"); }}>Soy cliente nuevo</button>
          </>
        )}

        {step === "guest" && (
          <>
            <h2 className={styles.title}>Tus datos</h2>
            <label className={styles.label}>Nombre</label>
            <input className={styles.input} value={guest.given_name} onChange={(e) => setGuest({ ...guest, given_name: e.target.value })} />
            <label className={styles.label}>Apellido</label>
            <input className={styles.input} value={guest.family_name} onChange={(e) => setGuest({ ...guest, family_name: e.target.value })} />
            <label className={styles.label}>Correo</label>
            <input className={styles.input} type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
            <label className={styles.label}>Teléfono</label>
            <input className={styles.input} value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
            <button className={styles.primaryBtn} onClick={continueGuest}>Continuar</button>
            <button className={styles.linkBtn} onClick={() => setStep("cart")}>Volver al carrito</button>
          </>
        )}

        {step === "pay" && (
          <>
            <h2 className={styles.title}>Método de pago</h2>
            <p className={styles.lead}>Se usará el mismo método para toda la orden. Total: <strong>{cur} {formatted(total)}</strong></p>
            <div className={styles.list}>
              {paymentMethods.map((pm) => (
                <label key={pm.payment_method_id} className={`${styles.payOption} ${selectedPm === pm.payment_method_id ? styles.payOptionActive : ""}`}>
                  <input type="radio" name="pm" value={pm.payment_method_id} checked={selectedPm === pm.payment_method_id} onChange={() => setSelectedPm(pm.payment_method_id)} />
                  <span>{pm.payment_method_name}</span>
                </label>
              ))}
            </div>
            <button className={styles.primaryBtn} disabled={!selectedPm || checkout.isPending} onClick={() => checkout.mutate()}>
              {checkout.isPending ? "Enviando..." : <><Check size={16} /> Confirmar pedido</>}
            </button>
            <button className={styles.linkBtn} onClick={() => setStep("cart")}>Volver al carrito</button>
          </>
        )}

        {step === "success" && (
          <>
            <h2 className={styles.title}>¡Pedido enviado!</h2>
            <p className={styles.lead}>Recibirás un correo con el resumen y las instrucciones de pago. Revisa también spam o promociones.</p>
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
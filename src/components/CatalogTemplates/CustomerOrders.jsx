import { useEffect, useId, useRef, useState } from "react";
import { Check, X, Bike, Store, Pencil, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMyOrders, cancelOrderWithToken, uploadReceipt, clearCustomerSession } from "../../services/customerAuthApi";
import { currencies, formatted } from "../../helpers/utils";
import styles from "./CustomerPortal.module.css";
import useDialog from "./useDialog";

const STATUS_LABEL = {
  "Pendiente de pago": "Pendiente de pago",
  "Pendiente de validación": "En validación",
  Aprobada: "Pago aprobado",
  Entregada: "Entregada",
  Cancelada: "Cancelada",
};
// Etapas del ciclo de una orden (mismas claves que STATUS_LABEL; "Cancelada" no es etapa).
const STAGES = ["Pendiente de pago", "Pendiente de validación", "Aprobada", "Entregada"];

// Stepper estático del estado de la orden (efecto 14, sin animación).
const OrderStepper = ({ status }) => {
  if (status === "Cancelada") {
    return (
      <p className={styles.cancelledNote}>
        <XCircle size={16} aria-hidden="true" /> Esta orden fue cancelada.
      </p>
    );
  }
  const current = STAGES.indexOf(status);
  if (current === -1) return null;
  return (
    <ol className={styles.stepper} aria-label="Progreso de la orden">
      {STAGES.map((st, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li
            key={st}
            className={`${styles.step} ${state === "done" ? styles.stepDone : state === "current" ? styles.stepCurrent : ""}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className={styles.stepDot} aria-hidden="true">
              {state === "done" && <Check size={14} strokeWidth={3} />}
            </span>
            <span>
              {STATUS_LABEL[st]}
              {state === "done" && <span className={styles.srOnly}> (completado)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const symbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";
const accountType = (t) => (t === "checking" ? "Corriente" : t === "savings" ? "Ahorros" : t || "");

// agrupa por order_group; las viejas sin order_group quedan como grupo de una
const buildGroups = (txs) => {
  const map = new Map();
  txs.forEach((t) => {
    const key = t.order_group || t.transaction_id;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  });
  return Array.from(map.entries()).map(([key, items]) => {
    const ref = items[0];
    const total = items.reduce((s, it) =>
      s + (Number(it.price) || 0) * (Number(it.quantity) || 1) + (Number(it.delivery_price) || 0), 0);
    return { key, items, ref, total, status: ref.status, pm: ref.payment_method || {} };
  });
};

const CustomerOrders = ({ businessId, onClose, onSessionExpired }) => {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [uploadingKey, setUploadingKey] = useState(null);
  const fileRefs = useRef({});

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["my-orders", businessId],
    queryFn: () => fetchMyOrders(businessId),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => { if (isError && !isFetching) onSessionExpired?.(); }, [isError, isFetching, onSessionExpired]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-orders", businessId] });

  const cancelM = useMutation({
    mutationFn: () => cancelOrderWithToken(businessId, cancelTarget.ref.transaction_id, cancelReason || "Cancelada por el cliente"),
    onSuccess: () => { invalidate(); setCancelTarget(null); setCancelReason(""); },
  });

  const onPickFile = async (group, file) => {
    if (!file) return;
    setUploadingKey(group.key);
    try {
      await uploadReceipt(businessId, group.ref.transaction_id, file); // el backend lo aplica a todo el grupo
      invalidate();
    } catch {
      alert("No se pudo subir el comprobante. Intenta de nuevo.");
    } finally {
      setUploadingKey(null);
    }
  };

  const logout = () => { clearCustomerSession(businessId); onClose(); };

  const dialogRef = useDialog(onClose);
  const cancelRef = useDialog(() => { setCancelTarget(null); setCancelReason(""); }, !!cancelTarget);
  const titleId = useId();
  const cancelTitleId = useId();

  if (isLoading || (isFetching && !data)) {
    return (
      <div className={styles.portal} onClick={onClose}>
        <div className={styles.sheet} onClick={(e) => e.stopPropagation()} ref={dialogRef} role="dialog" aria-modal="true" aria-label="Mis órdenes" aria-busy="true" tabIndex={-1}>
          <p className={styles.lead} style={{ textAlign: "center", padding: "2rem 0" }} role="status">Cargando tus órdenes...</p>
        </div>
      </div>
    );
  }

  const customer = data || {};
  const groups = buildGroups(customer.transactions || []);

  return (
    <div className={styles.portal} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()} ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
        <h2 className={styles.srOnly} id={titleId}>Mis órdenes</h2>

        <div className={styles.portalHead}>
          {customer.business_logo_url ? (
            <img src={customer.business_logo_url} alt={customer.business_name} className={styles.brandLogo} decoding="async" />
          ) : (<h2 className={styles.title} style={{ margin: 0 }}>{customer.business_name}</h2>)}
          <div>
            <div className={styles.hello}>Hola, {customer.given_name || customer.full_name}</div>
            <div className={styles.email}>{customer.email}</div>
          </div>
        </div>

        <div className={styles.list}>
          {groups.length === 0 && <p className={styles.empty}>Aún no tienes órdenes.</p>}

          {groups.map((g) => {
            const cur = symbol(g.ref.currency || g.pm.currency);
            const open = expanded === g.key;
            const isBank = g.pm.payment_type === "bank_transfer";
            const payable = g.status === "Pendiente de pago";
            const inReview = g.status === "Pendiente de validación";
            const multi = g.items.length > 1;
            const title = multi ? `Orden de ${g.items.length} productos` : g.ref.product_name;
            return (
              <div key={g.key} className={styles.orderCard}>
                <button
                  type="button"
                  className={styles.orderHead}
                  onClick={() => setExpanded(open ? null : g.key)}
                  aria-expanded={open}
                  aria-controls={`order-${g.key}`}
                >
                  <div>
                    <div className={styles.productName}>{title}</div>
                    <div className={styles.meta}>Total: {cur} {formatted(g.total)}</div>
                  </div>
                  <span className={styles.badge} data-status={g.status}>{STATUS_LABEL[g.status] || g.status}</span>
                </button>

                {open && (
                  <div className={styles.orderBody} id={`order-${g.key}`}>
                    <OrderStepper status={g.status} />
                    <ul className={styles.detail}>
                      {g.items.map((it) => (
                        <li key={it.transaction_id}>
                          <span>{it.product_name} (x{it.quantity}){it.locality ? ` · ${it.locality}` : ""}{it.delivery_day ? ` · ${it.delivery_day}` : ""}{it.comment ? <> · <Pencil size={12} aria-hidden="true" /> {it.comment}</> : ""}</span>
                          <strong>{cur} {formatted(it.price * it.quantity)}</strong>
                        </li>
                        
                      ))}
                      <li><span>Método</span><strong>{isBank ? "Transferencia" : "Link de pago"}</strong></li>
                      {g.ref.fulfillment_type && (
                        <li><span>Entrega</span><strong>{g.ref.fulfillment_type === "delivery"
                          ? <><Bike size={14} aria-hidden="true" /> Delivery</>
                          : <><Store size={14} aria-hidden="true" /> Take out</>}</strong></li>
                      )}
                      {g.ref.delivery_price > 0 && (
                        <li><span>Costo delivery</span><strong>{cur} {formatted(g.ref.delivery_price)}</strong></li>
                      )}
                      {g.ref.delivery_address && (
                        <li><span>Dirección de entrega</span><strong>{g.ref.delivery_address}</strong></li>
                      )}
                      <li><span>Total</span><strong>{cur} {formatted(g.total)}</strong></li>
                      {g.status === "Cancelada" && g.ref.cancellation_reason && (
                        <li><span>Motivo</span><strong>{g.ref.cancellation_reason}</strong></li>
                      )}
                    </ul>

                    {isBank && payable && (
                      <div className={styles.payBox}>
                        <div className={styles.payTitle}>Datos para transferir</div>
                        {g.pm.bank_name && <div className={styles.payRow}><span>Banco</span><b>{g.pm.bank_name}</b></div>}
                        {g.pm.account_number && <div className={styles.payRow}><span>Cuenta</span><b>{g.pm.account_number}</b></div>}
                        {g.pm.account_type && <div className={styles.payRow}><span>Tipo</span><b>{accountType(g.pm.account_type)}</b></div>}
                        {g.pm.owner_name && <div className={styles.payRow}><span>Titular</span><b>{g.pm.owner_name}</b></div>}
                        {g.pm.owner_document && <div className={styles.payRow}><span>Documento</span><b>{g.pm.owner_document}</b></div>}
                        <div className={styles.payRow}><span>Monto total</span><b>{cur} {formatted(g.total)}</b></div>
                      </div>
                    )}

                    {g.pm.payment_link && payable && (
                      <a className={styles.payLink} href={g.pm.payment_link} target="_blank" rel="noreferrer">Pagar ahora</a>
                    )}
                    {g.ref.receipt_url && (
                      <a className={styles.viewReceipt} href={g.ref.receipt_url} target="_blank" rel="noreferrer">Ver comprobante enviado</a>
                    )}

                    {(payable || inReview) && (
                      <div className={styles.actions}>
                        {payable && (
                          <>
                            <input
                              ref={(el) => (fileRefs.current[g.key] = el)}
                              type="file" accept="image/*,application/pdf" hidden
                              onChange={(e) => onPickFile(g, e.target.files?.[0])}
                            />
                            <button type="button" className={styles.uploadBtn} disabled={uploadingKey === g.key} onClick={() => fileRefs.current[g.key]?.click()}>
                              {uploadingKey === g.key ? "Subiendo..." : g.ref.receipt_url ? "Reemplazar comprobante" : "Subir comprobante"}
                            </button>
                          </>
                        )}
                        <button type="button" className={styles.cancelBtn} onClick={() => setCancelTarget(g)}>Cancelar orden</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" className={styles.logout} onClick={logout}>Cerrar sesión</button>
      </div>

      {cancelTarget && (
        <div className={styles.overlay} onClick={(e) => { e.stopPropagation(); setCancelTarget(null); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} ref={cancelRef} role="dialog" aria-modal="true" aria-labelledby={cancelTitleId} tabIndex={-1}>
            <h3 className={styles.title} id={cancelTitleId}>Cancelar orden</h3>
            <p className={styles.lead}>
              ¿Seguro que deseas cancelar {cancelTarget.items.length > 1 ? `esta orden de ${cancelTarget.items.length} productos` : <strong>{cancelTarget.ref.product_name}</strong>}?
            </p>
            <textarea className={styles.input} rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Motivo (opcional)" aria-label="Motivo de la cancelación (opcional)" />
            <div className={styles.modalActions}>
              <button type="button" className={styles.linkBtn} onClick={() => { setCancelTarget(null); setCancelReason(""); }}>Volver</button>
              <button type="button" className={styles.cancelBtn} disabled={cancelM.isPending} onClick={() => cancelM.mutate()}>
                {cancelM.isPending ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
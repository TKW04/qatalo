import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyOrders,
  cancelOrderWithToken,
  uploadReceipt,
  clearCustomerSession,
} from "../../services/customerAuthApi";
import { currencies, formatted, getStatusStyle } from "../../helpers/utils";
import styles from "./CustomerPortal.module.css";

const STATUS_LABEL = {
  "Pendiente de pago": "Pendiente de pago",
  "Pendiente de validación": "En validación",
  Aprobada: "Pago aprobado",
  Entregada: "Entregada",
  Cancelada: "Cancelada",
};
const symbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";
const accountType = (t) => (t === "checking" ? "Corriente" : t === "savings" ? "Ahorros" : t || "");

const CustomerOrders = ({ businessId, onClose, onSessionExpired }) => {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [uploadingId, setUploadingId] = useState(null);
  const fileRefs = useRef({});

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["my-orders", businessId],
    queryFn: () => fetchMyOrders(businessId),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always", // ignora el error/caché viejo y vuelve a pedir al montar
  });

  useEffect(() => {
    // solo si ya terminó de cargar Y de verdad falló (no por un error cacheado)
    if (isError && !isFetching) onSessionExpired?.();
  }, [isError, isFetching, onSessionExpired]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-orders", businessId] });

  const cancelM = useMutation({
    mutationFn: () =>
      cancelOrderWithToken(businessId, cancelTarget.transaction_id, cancelReason || "Cancelada por el cliente"),
    onSuccess: () => { invalidate(); setCancelTarget(null); setCancelReason(""); },
  });

  const onPickFile = async (tx, file) => {
    if (!file) return;
    setUploadingId(tx.transaction_id);
    try {
      await uploadReceipt(businessId, tx.transaction_id, file);
      invalidate();
    } catch {
      alert("No se pudo subir el comprobante. Intenta de nuevo.");
    } finally {
      setUploadingId(null);
    }
  };

  const logout = () => { clearCustomerSession(businessId); onClose(); };

  if (isLoading || (isFetching && !data)) {
    return (
      <div className={styles.portal} onClick={onClose}>
        <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
          <p className={styles.lead} style={{ textAlign: "center", padding: "2rem 0" }}>Cargando tus órdenes...</p>
        </div>
      </div>
    );
  }

  const customer = data || {};
  const txs = customer.transactions || [];

  return (
    <div className={styles.portal} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Cerrar">×</button>

        <div className={styles.portalHead}>
          {customer.business_logo_url ? (
            <img src={customer.business_logo_url} alt={customer.business_name} className={styles.brandLogo} />
          ) : (
            <h2 className={styles.title} style={{ margin: 0 }}>{customer.business_name}</h2>
          )}
          <div>
            <div className={styles.hello}>Hola, {customer.given_name || customer.full_name}</div>
            <div className={styles.email}>{customer.email}</div>
          </div>
        </div>

        <div className={styles.list}>
          {txs.length === 0 && <p className={styles.empty}>Aún no tienes órdenes.</p>}

          {txs.map((t) => {
            const cur = symbol(t.payment_method?.currency);
            const open = expanded === t.transaction_id;
            const isBank = t.payment_method?.payment_type === "bank_transfer";
            const payable = t.status === "Pendiente de pago";
            const inReview = t.status === "Pendiente de validación";
            const pm = t.payment_method || {};
            return (
              <div key={t.transaction_id} className={styles.orderCard}>
                <button className={styles.orderHead} onClick={() => setExpanded(open ? null : t.transaction_id)}>
                  <div>
                    <div className={styles.productName}>{t.product_name}</div>
                    <div className={styles.meta}>x{t.quantity} · {cur} {formatted(t.price * t.quantity)}</div>
                  </div>
                  <span className={styles.badge} style={getStatusStyle(t.status)}>
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                </button>

                {open && (
                  <div className={styles.orderBody}>
                    <ul className={styles.detail}>
                      <li><span>Precio unitario</span><strong>{cur} {formatted(t.price)}</strong></li>
                      <li><span>Total</span><strong>{cur} {formatted(t.price * t.quantity)}</strong></li>
                      {t.delivery_day && <li><span>Entrega</span><strong>{t.delivery_day}</strong></li>}
                      {t.locality && <li><span>Localidad</span><strong>{t.locality}</strong></li>}
                      <li><span>Método</span><strong>{isBank ? "Transferencia" : "Link de pago"}</strong></li>
                      {t.status === "Cancelada" && t.cancellation_reason && (
                        <li><span>Motivo</span><strong>{t.cancellation_reason}</strong></li>
                      )}
                    </ul>

                    {isBank && payable && (
                      <div className={styles.payBox}>
                        <div className={styles.payTitle}>Datos para transferir</div>
                        {pm.bank_name && <div className={styles.payRow}><span>Banco</span><b>{pm.bank_name}</b></div>}
                        {pm.account_number && <div className={styles.payRow}><span>Cuenta</span><b>{pm.account_number}</b></div>}
                        {pm.account_type && <div className={styles.payRow}><span>Tipo</span><b>{accountType(pm.account_type)}</b></div>}
                        {pm.owner_name && <div className={styles.payRow}><span>Titular</span><b>{pm.owner_name}</b></div>}
                        {pm.owner_document && <div className={styles.payRow}><span>Documento</span><b>{pm.owner_document}</b></div>}
                      </div>
                    )}

                    {pm.payment_link && payable && (
                      <a className={styles.payLink} href={pm.payment_link} target="_blank" rel="noreferrer">Pagar ahora</a>
                    )}
                    {t.receipt_url && (
                      <a className={styles.viewReceipt} href={t.receipt_url} target="_blank" rel="noreferrer">Ver comprobante enviado</a>
                    )}

                    {(payable || inReview) && (
                      <div className={styles.actions}>
                        {payable && (
                          <>
                            <input
                              ref={(el) => (fileRefs.current[t.transaction_id] = el)}
                              type="file"
                              accept="image/*,application/pdf"
                              hidden
                              onChange={(e) => onPickFile(t, e.target.files?.[0])}
                            />
                            <button
                              className={styles.uploadBtn}
                              disabled={uploadingId === t.transaction_id}
                              onClick={() => fileRefs.current[t.transaction_id]?.click()}
                            >
                              {uploadingId === t.transaction_id
                                ? "Subiendo..."
                                : t.receipt_url ? "Reemplazar comprobante" : "Subir comprobante"}
                            </button>
                          </>
                        )}
                        <button className={styles.cancelBtn} onClick={() => setCancelTarget(t)}>Cancelar orden</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className={styles.logout} onClick={logout}>Cerrar sesión</button>
      </div>

      {cancelTarget && (
        <div className={styles.overlay} onClick={() => setCancelTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.title}>Cancelar orden</h3>
            <p className={styles.lead}>¿Seguro que deseas cancelar la orden de <strong>{cancelTarget.product_name}</strong>?</p>
            <textarea
              className={styles.input}
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo (opcional)"
            />
            <div className={styles.modalActions}>
              <button className={styles.linkBtn} onClick={() => { setCancelTarget(null); setCancelReason(""); }}>Volver</button>
              <button className={styles.cancelBtn} disabled={cancelM.isPending} onClick={() => cancelM.mutate()}>
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
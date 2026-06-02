import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaPen, FaTrashCan, FaEye, FaArrowsRotate } from "react-icons/fa6";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import Loading from "../../../components/UI/Loading";
import PrimaryButton from "../../../components/PrimaryButton";
import { currencies } from "../../../helpers/utils";
import { fetchBusinessData } from "../../../services/businessApi";
import {
  fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../../../services/paymentMethodsApi";
import adminStyles from "../AdminDashboard.module.css";
import styles from "./PaymentMethods.module.css";

const PAYMENT_TYPES = [
  { code: "bank_transfer", name: "Transferencia Bancaria" },
  { code: "payment_link", name: "Link de pago" },
];
const ACCOUNT_TYPES = [
  { code: "savings", name: "Ahorros" },
  { code: "current", name: "Corriente" },
];

const emptyForm = {
  payment_method_id: "", payment_method_name: "", business_id: "", payment_type: "",
  account_number: "", account_type: "", bank_name: "", routing_number: "",
  owner_name: "", owner_document: "", owner_email: "", swift: "",
  standard_account: "", payment_link: "", currency: "",
};

const PaymentMethods = () => {
  const auth = getTokenInfo();
  const tenantId = auth?.sub;
  const { showError, showWarning, showSuccess } = useNotification();
  const queryClient = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ["business", tenantId], queryFn: fetchBusinessData, enabled: !!tenantId, retry: false,
  });
  const { data: methods = [], isLoading, refetch } = useQuery({
    queryKey: ["paymentMethods", tenantId], queryFn: fetchPaymentMethods, enabled: !!tenantId, retry: false,
  });

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [viewing, setViewing] = useState(null);

  const editingId = form.payment_method_id;
  const isBank = form.payment_type === "bank_transfer";
  const isLink = form.payment_type === "payment_link";

  const setField = (id, value) => setForm((p) => ({ ...p, [id]: value }));
  const resetForm = () => { setForm(emptyForm); setErrors({}); };

  const typeName = useMemo(
    () => (code) => PAYMENT_TYPES.find((t) => t.code === code)?.name || "",
    []
  );
  const currencySymbol = (code) => currencies.find((c) => c.code === code)?.symbol || code || "";

  const validate = () => {
    const e = {};
    if (!form.payment_type) e.payment_type = "El tipo de pago es requerido";
    if (!form.payment_method_name) e.payment_method_name = "El nombre del método es requerido";
    if (form.payment_type === "bank_transfer") {
      if (!form.account_number) e.account_number = "El número de cuenta es requerido";
      if (!form.account_type) e.account_type = "El tipo de cuenta es requerido";
      if (!form.bank_name) e.bank_name = "El nombre del banco es requerido";
      if (!form.owner_name) e.owner_name = "El nombre del propietario es requerido";
      if (!form.owner_document) e.owner_document = "El documento es requerido";
      if (!form.owner_email) e.owner_email = "El email es requerido";
      if (!form.currency) e.currency = "La moneda es requerida";
    } else if (form.payment_type === "payment_link") {
      if (!form.payment_link) e.payment_link = "El enlace de pago es requerido";
      if (!form.currency) e.currency = "La moneda es requerida";
    }
    return e;
  };

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      payload.payment_method_id ? updatePaymentMethod(payload) : createPaymentMethod(payload),
    onSuccess: () => {
      showSuccess("¡Éxito!", editingId ? "Método de pago actualizado" : "Método de pago creado");
      queryClient.invalidateQueries({ queryKey: ["paymentMethods", tenantId] });
      resetForm();
    },
    onError: (err) => showWarning("Revisa la información", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePaymentMethod(id),
    onSuccess: () => {
      showSuccess("Eliminado", "Método de pago eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["paymentMethods", tenantId] });
      setToDelete(null);
    },
    onError: (err) => showError("Error", err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    saveMutation.mutate({
      ...form,
      payment_method_id: form.payment_method_id || undefined,
      business_id: business?.business_id || form.business_id,
      owner_email: form.owner_email || auth?.email || "",
    });
  };

  const handleEdit = (pm) => {
    setForm({ ...emptyForm, ...pm });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) return <Loading message="Cargando métodos de pago..." />;
  const busy = saveMutation.isPending;

  return (
    <div>
      <div className={adminStyles.adminHeader}>
        <h1>Gestión de Métodos de Pago</h1>
        <p>Crea métodos de pago para tu negocio</p>
      </div>

      {busy && <Loading message={editingId ? "Actualizando método de pago..." : "Creando método de pago..."} />}

      <div className={styles.card}>
        <h2>{editingId ? "Editar Método de Pago" : "Nuevo Método de Pago"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Método de Pago *</label>
            <select className="input" value={form.payment_type} onChange={(e) => setField("payment_type", e.target.value)}>
              <option value="">Seleccionar método de pago</option>
              {PAYMENT_TYPES.map((t) => (<option key={t.code} value={t.code}>{t.name}</option>))}
            </select>
            {errors.payment_type && <span className={styles.err}>{errors.payment_type}</span>}
          </div>

          {(isBank || isLink) && (
            <div className={styles.formGroup}>
              <label>Nombre del método *</label>
              <input className="input" value={form.payment_method_name} onChange={(e) => setField("payment_method_name", e.target.value)} placeholder="PayPal, Banco XYZ, etc." />
              {errors.payment_method_name && <span className={styles.err}>{errors.payment_method_name}</span>}
            </div>
          )}

          {isBank && (
            <>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Número de Cuenta *</label>
                  <input className="input" value={form.account_number} onChange={(e) => setField("account_number", e.target.value)} placeholder="123456789" />
                  {errors.account_number && <span className={styles.err}>{errors.account_number}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Nombre del Banco *</label>
                  <input className="input" value={form.bank_name} onChange={(e) => setField("bank_name", e.target.value)} placeholder="Banco XYZ" />
                  {errors.bank_name && <span className={styles.err}>{errors.bank_name}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nombre del Propietario *</label>
                  <input className="input" value={form.owner_name} onChange={(e) => setField("owner_name", e.target.value)} placeholder="Juan Pérez" />
                  {errors.owner_name && <span className={styles.err}>{errors.owner_name}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Número de Documento *</label>
                  <input className="input" value={form.owner_document} onChange={(e) => setField("owner_document", e.target.value)} placeholder="12345678789" />
                  {errors.owner_document && <span className={styles.err}>{errors.owner_document}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Email del Propietario *</label>
                  <input className="input" value={form.owner_email} onChange={(e) => setField("owner_email", e.target.value)} placeholder="juan@example.com" />
                  {errors.owner_email && <span className={styles.err}>{errors.owner_email}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Tipo de Cuenta *</label>
                  <select className="input" value={form.account_type} onChange={(e) => setField("account_type", e.target.value)}>
                    <option value="">Seleccionar tipo de cuenta</option>
                    {ACCOUNT_TYPES.map((t) => (<option key={t.code} value={t.code}>{t.name}</option>))}
                  </select>
                  {errors.account_type && <span className={styles.err}>{errors.account_type}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Moneda *</label>
                  <select className="input" value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
                    <option value="">Seleccionar moneda</option>
                    {currencies.map((c) => (<option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>))}
                  </select>
                  {errors.currency && <span className={styles.err}>{errors.currency}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Swift</label>
                  <input className="input" value={form.swift} onChange={(e) => setField("swift", e.target.value)} placeholder="BCPPDOSDXXX" />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Cuenta Estándar</label>
                  <input className="input" value={form.standard_account} onChange={(e) => setField("standard_account", e.target.value)} placeholder="DO34...3443" />
                </div>
                <div className={styles.formGroup}>
                  <label>Número de Ruta (Routing Number)</label>
                  <input className="input" value={form.routing_number} onChange={(e) => setField("routing_number", e.target.value)} placeholder="021000021" />
                </div>
              </div>
            </>
          )}

          {isLink && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Moneda *</label>
                <select className="input" value={form.currency} onChange={(e) => setField("currency", e.target.value)}>
                  <option value="">Seleccionar moneda</option>
                  {currencies.map((c) => (<option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>))}
                </select>
                {errors.currency && <span className={styles.err}>{errors.currency}</span>}
              </div>
              <div className={styles.formGroup}>
                <label>Link de pago *</label>
                <input className="input" value={form.payment_link} onChange={(e) => setField("payment_link", e.target.value)} placeholder="https://example.com/payment-link" />
                {errors.payment_link && <span className={styles.err}>{errors.payment_link}</span>}
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Guardando..." : editingId ? "Actualizar método de pago" : "Crear método de pago"}
            </PrimaryButton>
            {editingId && (<button type="button" className={styles.btnOutline} onClick={resetForm}>Cancelar edición</button>)}
          </div>
        </form>
      </div>

      <div className={styles.listHeader}>
        <h2>Métodos de pago existentes</h2>
        <button className={styles.refreshBtn} onClick={() => refetch()}><FaArrowsRotate /> Actualizar</button>
      </div>

      {methods.length === 0 ? (
        <div className={styles.empty}>Aún no tienes métodos de pago. Crea el primero arriba.</div>
      ) : (
        <div className={styles.list}>
          {methods.map((pm) => (
            <div key={pm.payment_method_id} className={styles.row}>
              <div className={styles.rowInfo}>
                <span className={styles.rowName}>{pm.payment_method_name}</span>
                <span className={styles.rowTag}>{typeName(pm.payment_type)}</span>
              </div>
              <div className={styles.rowActions}>
                <button className={styles.iconBtn} onClick={() => setViewing(pm)} aria-label="Ver"><FaEye /></button>
                <button className={styles.iconBtn} onClick={() => handleEdit(pm)} aria-label="Editar"><FaPen /></button>
                <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setToDelete(pm)} aria-label="Eliminar"><FaTrashCan /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toDelete && (
        <div className={styles.modalOverlay} onClick={() => setToDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar método de pago</h3>
            <p>¿Seguro que deseas eliminar <strong>{toDelete.payment_method_name}</strong>? Esta acción no se puede deshacer.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => setToDelete(null)}>Cancelar</button>
              <button className={styles.btnDanger} onClick={() => deleteMutation.mutate(toDelete.payment_method_id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className={styles.modalOverlay} onClick={() => setViewing(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{viewing.payment_method_name}</h3>
            <ul className={styles.detailList}>
              <li><span>Tipo</span><strong>{typeName(viewing.payment_type)}</strong></li>
              {viewing.payment_type === "bank_transfer" && (
                <>
                  <li><span>Titular</span><strong>{viewing.owner_name}</strong></li>
                  <li><span>Documento</span><strong>{viewing.owner_document}</strong></li>
                  <li><span>Email</span><strong>{viewing.owner_email}</strong></li>
                  <li><span>Banco</span><strong>{viewing.bank_name}</strong></li>
                  <li><span>N° de cuenta</span><strong>{viewing.account_number}</strong></li>
                  <li><span>Tipo de cuenta</span><strong>{ACCOUNT_TYPES.find((t) => t.code === viewing.account_type)?.name || "—"}</strong></li>
                  <li><span>Moneda</span><strong>{currencySymbol(viewing.currency)}</strong></li>
                  {viewing.swift && <li><span>SWIFT</span><strong>{viewing.swift}</strong></li>}
                  {viewing.routing_number && <li><span>Routing</span><strong>{viewing.routing_number}</strong></li>}
                  {viewing.standard_account && <li><span>Cuenta estándar</span><strong>{viewing.standard_account}</strong></li>}
                </>
              )}
              {viewing.payment_type === "payment_link" && (
                <>
                  <li><span>Enlace</span><strong>{viewing.payment_link}</strong></li>
                  <li><span>Moneda</span><strong>{currencySymbol(viewing.currency)}</strong></li>
                </>
              )}
            </ul>
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => setViewing(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
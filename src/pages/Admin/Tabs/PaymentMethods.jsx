import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Eye, RefreshCw, Wallet } from "lucide-react";

import { useNotification } from "../../../components/UI/NotificationProvider";
import { getTokenInfo } from "../../../helpers/token";
import { currencies } from "../../../helpers/utils";
import { fetchBusinessData } from "../../../services/businessApi";
import {
  fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../../../services/paymentMethodsApi";
import { PageHeader, Button, IconButton, Modal, EmptyState, SkeletonForm, SkeletonList } from "../../../components/admin";
import styles from "./PaymentMethods.module.css";
import CurrencySelect from "../../../components/CurrencySelect";
import Select from "../../../components/Select";

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

  const header = (
    <PageHeader title="Métodos de pago" description="Cómo te pagan tus clientes: transferencia bancaria o link de pago." />
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <SkeletonForm fields={3} label="Cargando métodos de pago..." />
        <div className={styles.listHeader}><h2>Métodos de pago existentes</h2></div>
        <SkeletonList rows={2} media={false} />
      </div>
    );
  }
  const busy = saveMutation.isPending;

  const focusForm = () => {
    document.getElementById("pm-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {header}

      <div className={styles.card} id="pm-form">
        <h2>{editingId ? "Editar método de pago" : "Nuevo método de pago"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup} role="group" aria-labelledby="pm-sel-1">
            <span id="pm-sel-1" className={styles.label}>Método de Pago *</span>
            <Select
              value={form.payment_type}
              onChange={(e) => setField("payment_type", e)}
              options={[
                { value: "", label: "Seleccionar método de pago" },
                ...PAYMENT_TYPES.map((t) => ({ value: t.code, label: t.name })),
              ]}
            />
            {errors.payment_type && <span className={styles.err} role="alert">{errors.payment_type}</span>}
          </div>

          {(isBank || isLink) && (
            <div className={styles.formGroup}>
              <label htmlFor="pm-payment_method_name">Nombre del método *</label>
              <input id="pm-payment_method_name" className="input" value={form.payment_method_name} onChange={(e) => setField("payment_method_name", e.target.value)} placeholder="PayPal, Banco XYZ, etc." />
              {errors.payment_method_name && <span className={styles.err} role="alert">{errors.payment_method_name}</span>}
            </div>
          )}

          {isBank && (
            <>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="pm-account_number">Número de Cuenta *</label>
                  <input id="pm-account_number" className="input" value={form.account_number} onChange={(e) => setField("account_number", e.target.value)} placeholder="123456789" />
                  {errors.account_number && <span className={styles.err} role="alert">{errors.account_number}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="pm-bank_name">Nombre del Banco *</label>
                  <input id="pm-bank_name" className="input" value={form.bank_name} onChange={(e) => setField("bank_name", e.target.value)} placeholder="Banco XYZ" />
                  {errors.bank_name && <span className={styles.err} role="alert">{errors.bank_name}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="pm-owner_name">Nombre del Propietario *</label>
                  <input id="pm-owner_name" className="input" value={form.owner_name} onChange={(e) => setField("owner_name", e.target.value)} placeholder="Juan Pérez" />
                  {errors.owner_name && <span className={styles.err} role="alert">{errors.owner_name}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="pm-owner_document">Número de Documento *</label>
                  <input id="pm-owner_document" className="input" value={form.owner_document} onChange={(e) => setField("owner_document", e.target.value)} placeholder="12345678789" />
                  {errors.owner_document && <span className={styles.err} role="alert">{errors.owner_document}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="pm-owner_email">Email del Propietario *</label>
                  <input id="pm-owner_email" className="input" value={form.owner_email} onChange={(e) => setField("owner_email", e.target.value)} placeholder="juan@example.com" />
                  {errors.owner_email && <span className={styles.err} role="alert">{errors.owner_email}</span>}
                </div>
                <div className={styles.formGroup} role="group" aria-labelledby="pm-sel-2">
                  <span id="pm-sel-2" className={styles.label}>Tipo de Cuenta *</span>
                  <Select
                    value={form.account_type}
                    onChange={(e) => setField("account_type", e)}
                    options={[
                      { value: "", label: "Seleccionar tipo de cuenta" },
                      ...ACCOUNT_TYPES.map((t) => ({ value: t.code, label: t.name })),
                    ]}
                  />
                  {errors.account_type && <span className={styles.err} role="alert">{errors.account_type}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} role="group" aria-labelledby="pm-sel-3">
                  <span id="pm-sel-3" className={styles.label}>Moneda *</span>
                  <CurrencySelect
                    value={form.currency}
                    onChange={(code) => setField("currency", code)}
                  />
                  {errors.currency && <span className={styles.err} role="alert">{errors.currency}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="pm-swift">Swift</label>
                  <input id="pm-swift" className="input" value={form.swift} onChange={(e) => setField("swift", e.target.value)} placeholder="BCPPDOSDXXX" />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="pm-standard_account">Cuenta Estándar</label>
                  <input id="pm-standard_account" className="input" value={form.standard_account} onChange={(e) => setField("standard_account", e.target.value)} placeholder="DO34...3443" />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="pm-routing_number">Número de Ruta (Routing Number)</label>
                  <input id="pm-routing_number" className="input" value={form.routing_number} onChange={(e) => setField("routing_number", e.target.value)} placeholder="021000021" />
                </div>
              </div>
            </>
          )}

          {isLink && (
            <div className={styles.formRow}>
              <div className={styles.formGroup} role="group" aria-labelledby="pm-sel-4">
                <span id="pm-sel-4" className={styles.label}>Moneda *</span>
                <CurrencySelect
                  value={form.currency}
                  onChange={(code) => setField("currency", code)}
                />
                {errors.currency && <span className={styles.err} role="alert">{errors.currency}</span>}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="pm-payment_link">Link de pago *</label>
                <input id="pm-payment_link" className="input" value={form.payment_link} onChange={(e) => setField("payment_link", e.target.value)} placeholder="https://example.com/payment-link" />
                {errors.payment_link && <span className={styles.err} role="alert">{errors.payment_link}</span>}
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <Button type="submit" loading={busy}>
              {busy ? "Guardando..." : editingId ? "Actualizar método de pago" : "Crear método de pago"}
            </Button>
            {editingId && (<Button variant="secondary" onClick={resetForm} disabled={busy}>Cancelar edición</Button>)}
          </div>
        </form>
      </div>

      <div className={styles.listHeader}>
        <h2>Métodos de pago existentes</h2>
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => refetch()}>Actualizar</Button>
      </div>

      {methods.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Aún no tienes métodos de pago"
          description="Agrega una cuenta bancaria o un link de pago para que tus clientes sepan cómo pagarte."
          action={<Button variant="secondary" onClick={focusForm}>Crear el primero</Button>}
        />
      ) : (
        <div className={styles.list}>
          {methods.map((pm) => (
            <div key={pm.payment_method_id} className={styles.row}>
              <div className={styles.rowInfo}>
                <span className={styles.rowName}>{pm.payment_method_name}</span>
                <span className={styles.rowTag}>{typeName(pm.payment_type)}</span>
              </div>
              <div className={styles.rowActions}>
                <IconButton icon={Eye} label={`Ver ${pm.payment_method_name}`} onClick={() => setViewing(pm)} />
                <IconButton icon={Pencil} label={`Editar ${pm.payment_method_name}`} onClick={() => handleEdit(pm)} />
                <IconButton icon={Trash2} variant="danger" label={`Eliminar ${pm.payment_method_name}`} onClick={() => setToDelete(pm)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        dismissible={!deleteMutation.isPending}
        size="sm"
        title="Eliminar método de pago"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(toDelete.payment_method_id)}>
              {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </>
        }
      >
        <p className={styles.modalText}>¿Seguro que deseas eliminar <strong>{toDelete?.payment_method_name}</strong>? Esta acción no se puede deshacer.</p>
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.payment_method_name}
        footer={<Button variant="secondary" onClick={() => setViewing(null)}>Cerrar</Button>}
      >
        {viewing && (
            <ul className={styles.detailList}>
              <li><span>Tipo</span><strong>{typeName(viewing.payment_type)}</strong></li>
              {viewing.payment_type === "bank_transfer" && (
                <>
                  <li><span>Titular</span><strong>{viewing.owner_name}</strong></li>
                  <li><span>Documento</span><strong>{viewing.owner_document}</strong></li>
                  <li><span>Email</span><strong>{viewing.owner_email}</strong></li>
                  <li><span>Banco</span><strong>{viewing.bank_name}</strong></li>
                  <li><span>N° de cuenta</span><strong>{viewing.account_number}</strong></li>
                  <li><span>Tipo de cuenta</span><strong>{ACCOUNT_TYPES.find((t) => t.code === viewing.account_type)?.name || "-"}</strong></li>
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
        )}
      </Modal>
    </div>
  );
};

export default PaymentMethods;
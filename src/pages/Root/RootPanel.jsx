import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaArrowsRotate, FaMagnifyingGlass, FaUsers, FaLightbulb,
  FaBoxOpen, FaCartShopping, FaShieldHalved,
} from "react-icons/fa6";
import { useNotification } from "../../components/UI/NotificationProvider";
import Loading from "../../components/UI/Loading";
import {
  fetchRootOverview, fetchRootBusinesses, fetchRootSuggestions, updateSuggestionStatus,
} from "../../services/rootApis";
import styles from "./RootPanel.module.css";

const STATUS_OPTS = [
  { value: "nueva", label: "Nueva" },
  { value: "en_revision", label: "En revisión" },
  { value: "planeada", label: "Planeada" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completada", label: "Completada" },
  { value: "descartada", label: "Descartada" },
];
const STATUS_LABEL = Object.fromEntries(STATUS_OPTS.map((s) => [s.value, s.label]));
const STATUS_COLOR = {
  nueva: { bg: "#DBEAFE", color: "#1E40AF" },
  en_revision: { bg: "#FEF3C7", color: "#92400E" },
  planeada: { bg: "#E0E7FF", color: "#3730A3" },
  en_progreso: { bg: "#CFFAFE", color: "#0E7490" },
  completada: { bg: "#D1FAE5", color: "#065F46" },
  descartada: { bg: "#F3F4F6", color: "#6B7280" },
};
const TYPE_LABEL = {
  feature: "✨ Nueva función",
  improvement: "💡 Mejora",
  bug: "🐞 Problema",
  other: "💬 Otra idea",
};

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date((s || "").replace(" ", "T"));
  if (isNaN(d)) return s;
  return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Tarjeta de sugerencia con edición de estado + notas ──
const SuggestionCard = ({ s, onSave, saving }) => {
  const [status, setStatus] = useState(s.status || "nueva");
  const [notes, setNotes] = useState(s.admin_notes || "");
  const dirty = status !== (s.status || "nueva") || notes !== (s.admin_notes || "");
  const sc = STATUS_COLOR[s.status] || STATUS_COLOR.nueva;

  return (
    <div className={styles.sugCard}>
      <div className={styles.sugTop}>
        <div className={styles.sugType}>{TYPE_LABEL[s.type] || TYPE_LABEL.other}</div>
        <span className={styles.badge} style={{ background: sc.bg, color: sc.color }}>
          {STATUS_LABEL[s.status] || s.status}
        </span>
      </div>
      <h3 className={styles.sugTitle}>{s.title}</h3>
      <p className={styles.sugDesc}>{s.description}</p>
      <div className={styles.sugMeta}>
        <span><strong>{s.business_name || "—"}</strong></span>
        <span>{s.email}</span>
        <span>{fmtDate(s.create_date)}</span>
      </div>

      <div className={styles.sugEdit}>
        <div className={styles.sugEditRow}>
          <label>Estado</label>
          <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <textarea
          className={styles.notes}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas internas (solo tú las ves)…"
        />
        <button
          className={styles.saveBtn}
          disabled={!dirty || saving}
          onClick={() => onSave({ suggestion_id: s.suggestion_id, status, admin_notes: notes })}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
};

const RootPanel = () => {
  const { showSuccess, showError } = useNotification();
  const qc = useQueryClient();
  const [tab, setTab] = useState("clients");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const overview = useQuery({ queryKey: ["root-overview"], queryFn: fetchRootOverview, retry: false });
  const businesses = useQuery({ queryKey: ["root-businesses"], queryFn: fetchRootBusinesses, retry: false, enabled: tab === "clients" });
  const suggestions = useQuery({ queryKey: ["root-suggestions"], queryFn: fetchRootSuggestions, retry: false, enabled: tab === "suggestions" });

  const statusM = useMutation({
    mutationFn: updateSuggestionStatus,
    onSuccess: () => { showSuccess("Actualizado", "Sugerencia actualizada"); qc.invalidateQueries({ queryKey: ["root-suggestions"] }); qc.invalidateQueries({ queryKey: ["root-overview"] }); },
    onError: (e) => showError("Error", e.message),
  });

  // Bloqueo de acceso (el backend devuelve 403 si no eres root)
  const restricted =
    overview.error?.message === "Acceso restringido" ||
    businesses.error?.message === "Acceso restringido" ||
    suggestions.error?.message === "Acceso restringido";

  const filteredBusinesses = useMemo(() => {
    const list = businesses.data || [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((b) =>
      (b.business_name || "").toLowerCase().includes(term) ||
      (b.owner_email || "").toLowerCase().includes(term) ||
      (b.slug || "").toLowerCase().includes(term)
    );
  }, [businesses.data, search]);

  const filteredSuggestions = useMemo(() => {
    const list = suggestions.data || [];
    const term = search.trim().toLowerCase();
    return list.filter((s) => {
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchTerm = !term ||
        (s.title || "").toLowerCase().includes(term) ||
        (s.description || "").toLowerCase().includes(term) ||
        (s.business_name || "").toLowerCase().includes(term);
      return matchStatus && matchTerm;
    });
  }, [suggestions.data, search, statusFilter]);

  if (restricted) {
    return (
      <div className={styles.restricted}>
        <FaShieldHalved size={40} />
        <h2>Acceso restringido</h2>
        <p>Esta sección es solo para administradores de Qatalo.</p>
      </div>
    );
  }

  const ov = overview.data || {};
  const byStatus = ov.suggestions_by_status || {};

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1><FaShieldHalved /> Panel Root</h1>
          <p>Vista interna de clientes y sugerencias</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => { overview.refetch(); businesses.refetch(); suggestions.refetch(); }}>
          <FaArrowsRotate /> Actualizar
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <FaUsers className={styles.statIcon} />
          <div><strong>{ov.businesses ?? "—"}</strong><span>Negocios</span></div>
        </div>
        <div className={styles.statCard}>
          <FaLightbulb className={styles.statIcon} />
          <div><strong>{ov.suggestions_total ?? "—"}</strong><span>Sugerencias</span></div>
        </div>
        <div className={styles.statCard}>
          <div style={{ width: "100%" }}>
            <div className={styles.miniStatusRow}>
              {STATUS_OPTS.map((o) => (
                <span key={o.value} className={styles.miniStatus} style={STATUS_COLOR[o.value]}>
                  {byStatus[o.value] || 0} {o.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "clients" ? styles.tabActive : ""}`} onClick={() => setTab("clients")}>
          <FaUsers /> Clientes
        </button>
        <button className={`${styles.tab} ${tab === "suggestions" ? styles.tabActive : ""}`} onClick={() => setTab("suggestions")}>
          <FaLightbulb /> Sugerencias
        </button>
      </div>

      {/* Buscador */}
      <div className={styles.searchBar}>
        <FaMagnifyingGlass color="#667085" />
        <input
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "clients" ? "Buscar negocio o correo…" : "Buscar sugerencia…"}
        />
        {search && <button className={styles.searchClear} onClick={() => setSearch("")}>×</button>}
        {tab === "suggestions" && (
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos los estados</option>
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>

      {/* ── TAB CLIENTES ── */}
      {tab === "clients" && (
        businesses.isLoading ? <Loading message="Cargando clientes..." /> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Negocio</th><th>Dueño</th><th>Suscripción</th>
                  <th>Prod.</th><th>Clientes</th><th>Órdenes</th><th>Cognito</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.length === 0 ? (
                  <tr><td colSpan={7} className={styles.emptyCell}>Sin resultados.</td></tr>
                ) : filteredBusinesses.map((b) => (
                  <tr key={b.business_id}>
                    <td>
                      <div className={styles.bizName}>{b.business_name || "—"}</div>
                      <div className={styles.bizSub}>/{b.slug}</div>
                    </td>
                    <td>
                      <div>{b.owner_email || "—"}</div>
                      <div className={styles.bizSub}>{b.phone}</div>
                    </td>
                    <td>
                      {b.subscription && Object.keys(b.subscription).length > 0 ? (
                        <div className={styles.subChips}>
                          {Object.entries(b.subscription).map(([k, v]) => (
                            <span key={k} className={styles.subChip}>{k}: <strong>{v}</strong></span>
                          ))}
                        </div>
                      ) : <span className={styles.bizSub}>—</span>}
                    </td>
                    <td className={styles.num}>{b.products_count ?? "—"}</td>
                    <td className={styles.num}>{b.customers_count ?? "—"}</td>
                    <td className={styles.num}>{b.orders_count ?? "—"}</td>
                    <td>
                      <span className={`${styles.cogStatus} ${b.cognito_enabled ? styles.cogOk : styles.cogOff}`}>
                        {b.cognito_status || (b.cognito_enabled ? "OK" : "—")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── TAB SUGERENCIAS ── */}
      {tab === "suggestions" && (
        suggestions.isLoading ? <Loading message="Cargando sugerencias..." /> : (
          filteredSuggestions.length === 0 ? (
            <div className={styles.empty}>No hay sugerencias que coincidan.</div>
          ) : (
            <div className={styles.sugGrid}>
              {filteredSuggestions.map((s) => (
                <SuggestionCard
                  key={s.suggestion_id}
                  s={s}
                  saving={statusM.isPending}
                  onSave={(payload) => statusM.mutate(payload)}
                />
              ))}
            </div>
          )
        )
      )}
    </div>
  );
};

export default RootPanel;
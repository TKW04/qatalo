import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;

const authHeaders = () => ({ "Content-Type": "application/json", Authorization: getToken() });

const handle = async (res) => {
  if (res.status === 200) return await res.json().catch(() => ({}));
  let message = "No se pudo cargar el resumen";
  try { const d = await res.json(); if (d?.message) message = d.message; } catch { /* sin body */ }
  throw new Error(message);
};

// Arma ?from=&to= omitiendo los vacíos
const toQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.append(k, v); });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

/**
 * { from?: "YYYY-MM-DD", to?: "YYYY-MM-DD" } ->
 * { range, totals, produced: [...], sold: [...], promises: [...] }
 * Los montos vienen agrupados por moneda ({ DOP: 1200, USD: 40 }); no se suman entre monedas.
 */
export const fetchDashboard = async (params) => {
  const res = await fetch(`${API_URL}reports/dashboard${toQuery(params)}`, { method: "GET", headers: authHeaders() });
  const data = await handle(res);
  return {
    range: data?.range || {},
    totals: data?.totals || {},
    produced: Array.isArray(data?.produced) ? data.produced : [],
    sold: Array.isArray(data?.sold) ? data.sold : [],
    promises: Array.isArray(data?.promises) ? data.promises : [],
  };
};

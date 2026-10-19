import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;

const authHeaders = () => ({ "Content-Type": "application/json", Authorization: getToken() });

const handle = async (res) => {
  if (res.status === 200) return await res.json().catch(() => ({}));
  let message = "Ocurrió un error con la producción";
  try { const d = await res.json(); if (d?.message) message = d.message; } catch { /* sin body */ }
  throw new Error(message);
};

// Arma ?from=&to=&product_id= omitiendo los vacíos
const toQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.append(k, v); });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

// { from?, to?, product_id? } -> lista de registros (más recientes primero)
export const fetchProductionLogs = async (params) => {
  const res = await fetch(`${API_URL}production${toQuery(params)}`, { method: "GET", headers: authHeaders() });
  const data = await handle(res);
  return Array.isArray(data) ? data : [];
};

// { product_id, quantity, date: "YYYY-MM-DD", note? } -> registro creado (suma al stock)
export const createProductionLog = async (log) => {
  const res = await fetch(`${API_URL}production`, { method: "POST", headers: authHeaders(), body: JSON.stringify(log) });
  return handle(res);
};

export const deleteProductionLog = async (logId) => {
  const res = await fetch(`${API_URL}production/${logId}`, { method: "DELETE", headers: authHeaders() });
  return handle(res);
};

// { from?, to? } -> { items: [{ product_id, product_name, produced, sold, difference }], totals }
export const fetchProductionReport = async (params) => {
  const res = await fetch(`${API_URL}production/report${toQuery(params)}`, { method: "GET", headers: authHeaders() });
  const data = await handle(res);
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    totals: data?.totals || { produced: 0, sold: 0, difference: 0 },
  };
};

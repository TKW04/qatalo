import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: getToken() });

const handle = async (res) => {
  if (res.status === 200) return await res.json().catch(() => ({}));
  let message = "Ocurrió un error con el método de pago";
  try { const d = await res.json(); if (d?.message) message = d.message; } catch { /* sin body */ }
  throw new Error(message);
};

export const fetchPaymentMethods = async () => {
  const res = await fetch(`${API_URL}payment_methods`, { method: "GET", headers: authHeaders() });
  return handle(res);
};

export const fetchPaymentMethodsByBusinessId = async (businessId) => {
  const res = await fetch(`${API_URL}payment_methods/${businessId}`, { method: "GET", headers: authHeaders() });
  return handle(res);
};

export const createPaymentMethod = async (pm) => {
  const res = await fetch(`${API_URL}payment_methods`, { method: "POST", headers: authHeaders(), body: JSON.stringify(pm) });
  return handle(res);
};

export const updatePaymentMethod = async (pm) => {
  const res = await fetch(`${API_URL}payment_methods/${pm.payment_method_id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(pm) });
  return handle(res);
};

export const deletePaymentMethod = async (id) => {
  const res = await fetch(`${API_URL}payment_methods/${id}`, { method: "DELETE", headers: authHeaders() });
  return handle(res);
};
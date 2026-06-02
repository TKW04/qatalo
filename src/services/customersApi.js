import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: getToken() });

const handle = async (res) => {
  if (res.status === 200) return await res.json().catch(() => ({}));
  let message = "Ocurrió un error con la operación";
  try { const d = await res.json(); if (d?.message) message = d.message; } catch { /* sin body */ }
  throw new Error(message);
};

// --- Clientes ---
export const fetchCustomers = async () => {
  const res = await fetch(`${API_URL}customers`, { method: "GET", headers: authHeaders() });
  const data = await handle(res);
  return Array.isArray(data) ? data : [];
};

export const createCustomer = async (customer) => {
  const res = await fetch(`${API_URL}customers/noTransaction`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(customer),
  });
  return handle(res); // 409 -> "Cliente ya existe"
};

export const updateCustomer = async (customer) => {
  const res = await fetch(`${API_URL}customers/${customer.customer_id}`, {
    method: "PUT", headers: authHeaders(),
    body: JSON.stringify({
      given_name: customer.given_name, family_name: customer.family_name,
      email: customer.email, phone: customer.phone,
    }),
  });
  return handle(res);
};

export const deleteCustomer = async (customerId) => {
  const res = await fetch(`${API_URL}customers/${customerId}`, { method: "DELETE", headers: authHeaders() });
  return handle(res);
};

// --- Transacciones ---
export const addTransaction = async (customerId, t) => {
  const res = await fetch(`${API_URL}customers/transactions/add`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({
      customer_id: customerId, delivery_day: t.delivery_day, price: t.price,
      quantity: t.quantity, product_id: t.product_id, product_name: t.product_name,
      payment_method: t.payment_method,
    }),
  });
  return handle(res);
};

export const updateTransaction = async (customerId, t) => {
  const res = await fetch(`${API_URL}customers/transactions/update`, {
    method: "PUT", headers: authHeaders(),
    body: JSON.stringify({
      customer_id: customerId, transaction_id: t.transaction_id, delivery_day: t.delivery_day,
      price: t.price, quantity: t.quantity, product_id: t.product_id,
      product_name: t.product_name, payment_method: t.payment_method,
    }),
  });
  return handle(res);
};

export const deleteTransaction = async (customerId, transactionId) => {
  const res = await fetch(`${API_URL}customers/transactions/delete`, {
    method: "DELETE", headers: authHeaders(),
    body: JSON.stringify({ customer_id: customerId, transaction_id: transactionId }),
  });
  return handle(res);
};

export const approveTransaction = async (customerId, transactionId) => {
  const res = await fetch(`${API_URL}customers/transactions/approve`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ customer_id: customerId, transaction_id: transactionId }),
  });
  return handle(res);
};

export const deliveredTransaction = async (customerId, transactionId) => {
  const res = await fetch(`${API_URL}customers/transactions/delivered`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ customer_id: customerId, transaction_id: transactionId }),
  });
  return handle(res);
};

export const cancelTransaction = async (customerId, transactionId, reason) => {
  const res = await fetch(`${API_URL}customers/transactions/cancelAdmin`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ customer_id: customerId, transaction_id: transactionId, cancellation_reason: reason }),
  });
  return handle(res);
};
const API_URL = import.meta.env.VITE_APP_API_URL;

const tokenKey = (businessId) => `qatalo_cust_${businessId}`;

export const getCustomerSession = (businessId) => {
  try {
    return JSON.parse(localStorage.getItem(tokenKey(businessId)) || "null");
  } catch {
    return null;
  }
};
export const setCustomerSession = (businessId, data) =>
  localStorage.setItem(tokenKey(businessId), JSON.stringify(data));
export const clearCustomerSession = (businessId) =>
  localStorage.removeItem(tokenKey(businessId));
  

const authHeaders = (businessId) => {
  const s = getCustomerSession(businessId);
  return s?.token ? { Authorization: `Bearer ${s.token}` } : {};
};

export const requestAccessCode = async (businessId, email) => {
  const res = await fetch(`${API_URL}customers/access/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ business_id: businessId, email }),
  });
  if (!res.ok) throw new Error("No se pudo enviar el código");
  return res.json();
};

export const verifyAccessCode = async (businessId, email, code) => {
  const res = await fetch(`${API_URL}customers/access/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ business_id: businessId, email, code }),
  });
  if (!res.ok) throw new Error("Código inválido o expirado");
  const data = await res.json(); // { token, customer }
  
  setCustomerSession(businessId, { token: data.token, email });
  return data;
};

export const fetchMyOrders = async (businessId) => {
  const res = await fetch(`${API_URL}customers/orders`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeaders(businessId) },
  });
  
  if (res.status === 401) {
    clearCustomerSession(businessId);
    throw new Error("Sesión expirada");
  }
  if (!res.ok) throw new Error("No se pudieron cargar tus órdenes");
  return res.json();
};

export const addOrderWithToken = async (businessId, transaction) => {
  const res = await fetch(`${API_URL}customers/orders/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(businessId) },
    body: JSON.stringify({ transaction }),
  });
  if (!res.ok) throw new Error("No se pudo crear la orden");
  return res.json();
};

export const cancelOrderWithToken = async (businessId, transactionId, reason) => {
  const res = await fetch(`${API_URL}customers/orders/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(businessId) },
    body: JSON.stringify({ transaction_id: transactionId, cancellation_reason: reason }),
  });
  if (!res.ok) throw new Error("No se pudo cancelar la orden");
  return res.json();
};

export const presignReceipt = async (businessId, transactionId, contentType) => {
  const res = await fetch(`${API_URL}customers/orders/receipt/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(businessId) },
    body: JSON.stringify({ transaction_id: transactionId, content_type: contentType }),
  });
  if (!res.ok) throw new Error("No se pudo preparar la subida");
  return res.json(); // { upload_url, file_url, key }
};

export const saveReceipt = async (businessId, payload) => {
  const res = await fetch(`${API_URL}customers/orders/receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(businessId) },
    body: JSON.stringify(payload), // { transaction_id, receipt_url, amount_paid, transfer_date, reference, destiny_account }
  });
  if (!res.ok) throw new Error("No se pudo registrar el comprobante");
  return res.json();
};

// Conveniencia: firma -> PUT directo a S3 -> guarda la url. Devuelve la receipt_url.
export const uploadReceipt = async (businessId, transactionId, file, extra = {}) => {
  const { upload_url, file_url } = await presignReceipt(businessId, transactionId, file.type);
  const put = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type }, // debe coincidir con el content_type firmado
    body: file,
  });
  if (!put.ok) throw new Error("No se pudo subir el comprobante a S3");
  await saveReceipt(businessId, { transaction_id: transactionId, receipt_url: file_url, ...extra });
  return file_url;
};
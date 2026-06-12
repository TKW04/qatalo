const API_URL = import.meta.env.VITE_APP_API_URL;

const tokenKey = (businessId) => `qatalo_cust_${businessId}`;

// decodifica el payload del token (sin verificar firma, solo para leer exp)
const decodeTokenPayload = (token) => {
  try {
    let p = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    p += "=".repeat((4 - (p.length % 4)) % 4);
    return JSON.parse(atob(p));
  } catch {
    return null;
  }
};
export const decodeCustomerToken = (token) => decodeTokenPayload(token);

// devuelve la sesión solo si el token sigue vigente; si venció, la limpia
export const getValidCustomerSession = (businessId) => {
  const s = getCustomerSession(businessId);
  if (!s?.token) return null;
  const payload = decodeTokenPayload(s.token);
  if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
    clearCustomerSession(businessId);
    return null;
  }
  return s;
};

export const getCustomerSession = (businessId) => {
  try {
    return JSON.parse(localStorage.getItem(tokenKey(businessId)) || "null");
  } catch {
    return null;
  }
};
export const setCustomerSession = (businessId, data) =>
  localStorage.setItem(tokenKey(businessId), JSON.stringify(data));

// --- memoria de la sesión del navegador (elección + datos de invitado) ---
const modeKey = (b) => `qatalo_cust_mode_${b}`;
const guestKey = (b) => `qatalo_cust_guest_${b}`;

export const getCustomerMode = (businessId) => {
  try { return sessionStorage.getItem(modeKey(businessId)); } catch { return null; } // "guest" | null
};
export const setCustomerMode = (businessId, mode) => {
  try { sessionStorage.setItem(modeKey(businessId), mode); } catch { }
};
export const clearCustomerMode = (businessId) => {
  try { sessionStorage.removeItem(modeKey(businessId)); } catch { }
};

export const getGuestInfo = (businessId) => {
  try { return JSON.parse(sessionStorage.getItem(guestKey(businessId)) || "null"); } catch { return null; }
};
export const setGuestInfo = (businessId, info) => {
  try { sessionStorage.setItem(guestKey(businessId), JSON.stringify(info)); } catch { }
};


export const clearCustomerSession = (businessId) => {
  localStorage.removeItem(tokenKey(businessId));
  clearCustomerMode(businessId);
};

const cartKey = (b) => `qatalo_cart_${b}`;
export const getCart = (b) => { try { return JSON.parse(sessionStorage.getItem(cartKey(b)) || "[]"); } catch { return []; } };
export const setCart = (b, items) => { try { sessionStorage.setItem(cartKey(b), JSON.stringify(items)); } catch { } };
export const clearCart = (b) => { try { sessionStorage.removeItem(cartKey(b)); } catch { } };
export const cartTotal = (items) =>
  (items || []).reduce((s, it) =>
    s + (Number(it.price) || 0) * (Number(it.quantity) || 1) + (Number(it.delivery_price) || 0), 0);
export const cartCount = (items) => (items || []).reduce((s, it) => s + (Number(it.quantity) || 1), 0);

export const checkoutCartWithToken = async (businessId, paymentMethodId, items) => {
  const res = await fetch(`${API_URL}customers/orders/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(businessId) },
    body: JSON.stringify({ payment_method: { payment_method_id: paymentMethodId }, items }),
  });
  if (!res.ok) throw new Error("No se pudo crear la orden");
  return res.json();
};


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
  setCustomerSession(businessId, {
    token: data.token,
    email,
    given_name: data.customer?.given_name || "",
    family_name: data.customer?.family_name || "",
    full_name: data.customer?.full_name || "",
  });
  clearCustomerMode(businessId);
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
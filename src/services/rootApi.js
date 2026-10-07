import { getToken, setToken, isNotValidToken } from "../helpers/token";
import { getCurrentSession } from "./authenticate";
import userpoolMerchants from "./userpoolMerchants";

const API_URL = import.meta.env.VITE_APP_API_URL;

// El idToken de Cognito dura 1 h y solo AdminDashboard lo renovaba al montar.
// Aquí lo renovamos antes de llamar (si expiró) y una vez más ante un 401.
// Las 3 queries del panel salen en paralelo: compartimos la misma promesa.
let refreshing = null;
const refreshToken = () => {
  if (!refreshing) {
    refreshing = getCurrentSession(userpoolMerchants)
      .then((session) => {
        const token = session.getIdToken().getJwtToken();
        setToken(token);
        return token;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
};

const validToken = async () => {
  if (!isNotValidToken()) return getToken();
  try { return await refreshToken(); } catch { return getToken(); }
};

const httpError = (message, status) => Object.assign(new Error(message), { status });

// fetch autenticado: token vigente + un reintento tras renovar sesión si hay 401
const authFetch = async (endpoint, init = {}) => {
  const send = (token) =>
    fetch(`${API_URL}${endpoint}`, { ...init, headers: { ...init.headers, Authorization: token } });
  let response = await send(await validToken());
  if (response.status === 401) {
    const fresh = await refreshToken().catch(() => null);
    if (fresh) response = await send(fresh);
  }
  return response;
};

const authGet = async (endpoint) => {
  const response = await authFetch(endpoint, { method: "GET" });
  if (response.status === 403) throw httpError("Acceso restringido", 403);
  if (response.status === 401) throw httpError("Sesión inválida o expirada", 401);
  if (!response.ok) throw httpError("No se pudo cargar la información", response.status);
  return await response.json();
};

/** Resumen: # negocios, total de sugerencias y desglose por estado */
export const fetchRootOverview = () => authGet("root/overview");

/** Lista de negocios (clientes) con conteos y perfil Cognito del dueño */
export const fetchRootBusinesses = () => authGet("root/businesses");

/** Todas las sugerencias (con campos de administración) */
export const fetchRootSuggestions = () => authGet("root/suggestions");

/** Cambia el estado y/o notas internas de una sugerencia */
export const updateSuggestionStatus = async ({ suggestion_id, status, admin_notes }) => {
  const response = await authFetch("root/suggestions/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suggestion_id, status, admin_notes }),
  });
  if (!response.ok) {
    let msg = "No se pudo actualizar la sugerencia";
    try { const d = await response.json(); if (d?.message) msg = d.message; } catch { /* noop */ }
    throw new Error(msg);
  }
  return await response.json();
};

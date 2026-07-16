import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;

const authGet = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: { Authorization: getToken() },
  });
  if (response.status === 403) throw new Error("Acceso restringido");
  if (response.status === 401) throw new Error("Sesión inválida o expirada");
  if (!response.ok) throw new Error("No se pudo cargar la información");
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
  const response = await fetch(`${API_URL}root/suggestions/status`, {
    method: "POST",
    headers: { Authorization: getToken(), "Content-Type": "application/json" },
    body: JSON.stringify({ suggestion_id, status, admin_notes }),
  });
  if (!response.ok) {
    let msg = "No se pudo actualizar la sugerencia";
    try { const d = await response.json(); if (d?.message) msg = d.message; } catch { /* noop */ }
    throw new Error(msg);
  }
  return await response.json();
};

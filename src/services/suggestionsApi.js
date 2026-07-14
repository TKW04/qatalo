import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;

/**
 * Envía una sugerencia de mejora / nueva función (dueño autenticado).
 * payload: { title, description, type }  // type: feature | improvement | bug | other
 */
export const createSuggestion = async (payload) => {
  const response = await fetch(`${API_URL}suggestions`, {
    method: "POST",
    headers: {
      Authorization: getToken(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let msg = "No se pudo enviar la sugerencia";
    try {
      const data = await response.json();
      if (data?.message) msg = data.message;
    } catch { /* noop */ }
    throw new Error(msg);
  }
  return await response.json();
};

/**
 * Lista las sugerencias enviadas por el dueño autenticado (su historial + estatus).
 */
export const fetchMySuggestions = async () => {
  const response = await fetch(`${API_URL}suggestions`, {
    method: "GET",
    headers: { Authorization: getToken() },
  });
  if (!response.ok) throw new Error("No se pudieron cargar tus sugerencias");
  return await response.json();
};
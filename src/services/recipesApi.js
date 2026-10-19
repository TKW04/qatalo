import { getToken } from "../helpers/token";

// Recetas: solo control de costos. No afecta inventario ni usa /production.
const API_URL = import.meta.env.VITE_APP_API_URL;

const authHeaders = () => ({ "Content-Type": "application/json", Authorization: getToken() });

const handle = async (res) => {
  if (res.status === 200 || res.status === 201) return await res.json().catch(() => ({}));
  let message = "Ocurrió un error con las recetas";
  try { const d = await res.json(); if (d?.message) message = d.message; } catch { /* sin body */ }
  throw new Error(message);
};

// -> [{ recipe_id, name, yield_lb, notes?, ingredients[], packaging[], create_date, update_date }]
export const fetchRecipes = async () => {
  const res = await fetch(`${API_URL}recipes`, { method: "GET", headers: authHeaders() });
  const data = await handle(res);
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
};

// { name, yield_lb, notes?, ingredients[], packaging[] } -> receta creada
export const createRecipe = async (recipe) => {
  const res = await fetch(`${API_URL}recipes`, { method: "POST", headers: authHeaders(), body: JSON.stringify(recipe) });
  return handle(res);
};

export const updateRecipe = async (recipeId, recipe) => {
  const res = await fetch(`${API_URL}recipes/${encodeURIComponent(recipeId)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(recipe),
  });
  return handle(res);
};

export const deleteRecipe = async (recipeId) => {
  const res = await fetch(`${API_URL}recipes/${encodeURIComponent(recipeId)}`, { method: "DELETE", headers: authHeaders() });
  return handle(res);
};

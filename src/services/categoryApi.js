import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: getToken(),
});

// Devuelve el JSON si es 200; si no, lanza el mensaje del backend
const handleResponse = async (res) => {
  if (res.status === 200) {
    return await res.json().catch(() => ({}));
  }
  let message = "Ocurrió un error procesando la categoría";
  try {
    const data = await res.json();
    if (data?.message) message = data.message;
  } catch {
    /* respuesta sin cuerpo JSON */
  }
  throw new Error(message);
};

// Todas las categorías del negocio autenticado (vía token)
export const fetchCategories = async () => {
  const res = await fetch(`${API_URL}categories`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// Categorías por business_id (para la vista pública del portal)
export const fetchCategoriesByBusinessId = async (businessId) => {
  const res = await fetch(`${API_URL}categories/${businessId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const createCategory = async (category) => {
  const res = await fetch(`${API_URL}categories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(category),
  });
  return handleResponse(res);
};

export const updateCategory = async (category) => {
  const res = await fetch(`${API_URL}categories/${category.category_id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(category),
  });
  return handleResponse(res);
};

export const deleteCategory = async (categoryId) => {
  const res = await fetch(`${API_URL}categories/${categoryId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
};
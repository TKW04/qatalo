import { getToken } from "../helpers/token";

const API = import.meta.env.VITE_APP_API_URL;

const ah = () => ({
  Authorization: getToken(),
  "Content-Type": "application/json",
});

export const fetchOffers = async () => {
  const res = await fetch(`${API}offers`, { headers: ah() });
  if (!res.ok) throw new Error("No se pudieron cargar las ofertas");
  return res.json();
};

export const createOffer = async (payload) => {
  const res = await fetch(`${API}offers`, { method: "POST", headers: ah(), body: JSON.stringify(payload) });
  if (!res.ok) throw new Error("No se pudo crear la oferta");
  return res.json();
};

export const updateOffer = async (payload) => {
  const res = await fetch(`${API}offers/${payload.offer_id}`, { method: "PUT", headers: ah(), body: JSON.stringify(payload) });
  if (!res.ok) throw new Error("No se pudo actualizar la oferta");
  return res.json();
};

export const deleteOffer = async (id) => {
  const res = await fetch(`${API}offers/${id}`, { method: "DELETE", headers: ah() });
  if (!res.ok) throw new Error("No se pudo eliminar la oferta");
  return res.json();
};

// Pública — no requiere auth
export const fetchPublicOffers = async (businessId) => {
  try {
    const res = await fetch(`${API}offers/public/${businessId}`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
};
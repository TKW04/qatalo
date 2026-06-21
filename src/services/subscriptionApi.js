import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;

export const fetchPlans = async () => {
  const res = await fetch(`${API_URL}paddle/products`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("No se pudieron obtener los planes");
  return res.json();
};

export const fetchSubscription = async (subscriptionId) => {
  const res = await fetch(`${API_URL}paddle/subscription/${subscriptionId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: getToken() },
  });
  if (!res.ok) throw new Error("No se pudo obtener la suscripción");
  return res.json();
};

export const fetchReactivationPrices = async () => {
  const res = await fetch(`${API_URL}paddle/reactivation-prices`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: getToken() },
  });
  if (!res.ok) throw new Error("No se pudieron obtener los planes de reactivación");
  return res.json();
};
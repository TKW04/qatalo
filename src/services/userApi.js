import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;

const handle = async (res) => {
  if (!res.ok) {
    let msg = "La operación no se pudo completar";
    let code;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
      code = data?.code;
    } catch {
      /* respuesta sin JSON */
    }
    const err = new Error(msg);
    err.status = res.status;
    err.code = code;
    throw err;
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
};

export const createAccount = (user) =>
  fetch(`${API_URL}users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      given_name: user.given_name,
      family_name: user.family_name,
      email: user.email,
      password: user.password,
    }),
  }).then(handle);

export const updateUser = (user) =>
  fetch(`${API_URL}users/${user.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: getToken() },
    body: JSON.stringify({
      given_name: user.given_name,
      family_name: user.family_name,
      role: user.role,
      password: user.password,
    }),
  }).then(handle);

export const forgotPassword = (email) =>
  fetch(`${API_URL}users/forgot-password/${encodeURIComponent(email)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).then(handle);

// token: el token firmado del enlace /reset-password/:token (no el email ni el sub).
// Errores: err.code === "invalid_token" (enlace inválido/caducado/usado) | "invalid_password".
export const resetPassword = (token, password) =>
  fetch(`${API_URL}users/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  }).then(handle);

export const activateUser = (userId) =>
  fetch(`${API_URL}users/active/${userId}`, {
    method: "PUT",
    headers: { Authorization: getToken() },
  }).then(handle);

export const inactivateUser = (userId) =>
  fetch(`${API_URL}users/inactive/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: getToken() },
  }).then(handle);
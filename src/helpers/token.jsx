import { isExpired, decodeToken } from "react-jwt";

export const setToken = (token) => {
  
  localStorage.setItem("token", token);
};
export const isNotValidToken = () => {
  if (!localStorage.getItem("token")) {
    return true;
  }
  return isExpired(localStorage.getItem("token"));
};
export const getTokenInfo = () => {
  return decodeToken(localStorage.getItem("token"));
};
export const getToken = () => {
  return localStorage.getItem("token");
};
export const removeToken = () => {
  localStorage.removeItem("token");
};
export const getRoles = () => {
  return import.meta.env.VITE_APP_ADMIN_ROLES;
};

import { getToken } from "../helpers/token";
import { getPresignedUrl, uploadToS3 } from "./businessApi";

const API_URL = import.meta.env.VITE_APP_API_URL;

const authHeaders = () => ({ "Content-Type": "application/json", Authorization: getToken() });

const handle = async (res) => {
  if (res.status === 200) return await res.json().catch(() => ({}));
  let message = "Ocurrió un error con el producto";
  try { const d = await res.json(); if (d?.message) message = d.message; } catch { /* sin body */ }
  throw new Error(message);
};

export const fetchProducts = async () => {
  const res = await fetch(`${API_URL}products`, { method: "GET", headers: authHeaders() });
  return handle(res);
};

export const fetchProductsByBusinessId = async (businessId) => {
  const res = await fetch(`${API_URL}products/${businessId}`, { method: "GET", headers: authHeaders() });
  return handle(res);
};

export const createProduct = async (product) => {
  const res = await fetch(`${API_URL}products`, { method: "POST", headers: authHeaders(), body: JSON.stringify(product) });
  return handle(res);
};

export const updateProduct = async (product) => {
  const res = await fetch(`${API_URL}products/${product.product_id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(product) });
  return handle(res);
};

export const deleteProduct = async (productId) => {
  const res = await fetch(`${API_URL}products/${productId}`, { method: "DELETE", headers: authHeaders() });
  return handle(res);
};

export const deleteProductImage = async (productId, fileUrl) => {
  const res = await fetch(`${API_URL}products/delete/image`, {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ product_id: productId, file_url: fileUrl }),
  });
  return handle(res);
};

// Sube cada imagen a S3 (presign + PUT) y devuelve las URLs públicas
export const uploadProductImages = async (files) => {
  const urls = [];
  for (const file of files) {
    const ext = file.name.substring(file.name.lastIndexOf("."));
    const type = `prod-${crypto.randomUUID()}`;
    const { uploadUrl, publicUrl } = await getPresignedUrl(type, ext, file.type, "products");
    await uploadToS3(uploadUrl, file);
    urls.push(publicUrl);
  }
  return urls;
};
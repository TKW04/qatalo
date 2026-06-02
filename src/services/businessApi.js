import { getToken } from "../helpers/token";

const API_URL = import.meta.env.VITE_APP_API_URL;

/**
 * Obtiene la información del negocio del usuario autenticado
 */
export const fetchBusinessData = async () => {
  const response = await fetch(`${API_URL}businesses`, {
    method: "GET",
    headers: {
      Authorization: getToken(),
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener la información del negocio");
  }

  const data = await response.json();
  return data; 
};

/**
 * Obtiene el catálogo por su Slug (Para la vista pública)
 */
export const fetchBusinessBySlug = async (slug) => {
  const response = await fetch(`${API_URL}businesses/${slug}`, {
    method: "GET",
    // Nota: Si esta ruta pública no requiere token en tu API Gateway, puedes quitar el header.
    headers: {
      Authorization: getToken(), 
    },
  });

  if (!response.ok) {
    throw new Error("Catálogo no encontrado");
  }

  return await response.json();
};

/**
 * Crea o Actualiza el negocio (Smart Save)
 */
export const saveBusinessData = async (tenantId, businessData) => {
  const payload = {
    name: businessData.name,
    slug: businessData.slug,
    phone: businessData.phone,
    description: businessData.description || "",
    logo_url: businessData.logo_url || "",
    templateId: businessData.templateId || "default",
    themeType: businessData.themeType || "predefined",
    themePalette: businessData.themePalette || null, // objeto -> se guarda como Map
  };

  const isUpdating = businessData.business_id && businessData.business_id !== "";
  const endpoint = isUpdating
    ? `${API_URL}businesses/${businessData.business_id}`
    : `${API_URL}businesses`;
  const method = isUpdating ? "PUT" : "POST";

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: getToken(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Error al guardar la configuración del negocio");
  return await response.json();
};

// Nueva función para pedir permiso a S3
export const getPresignedUrl = async (fileType, fileExt, mimeType, folder = "business") => {
  const response = await fetch(`${import.meta.env.VITE_APP_API_URL}businesses/presign`, {
    method: "POST",
    headers: { Authorization: getToken(), "Content-Type": "application/json" },
    body: JSON.stringify({ type: fileType, ext: fileExt, mime: mimeType, folder }),
  });
  return await response.json();
};

// Función para subir directamente a S3
export const uploadToS3 = async (uploadUrl, file) => {
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type }
  });
};
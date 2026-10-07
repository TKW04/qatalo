// Estados de orden -> tono visual único (tokens --state-* de globals.css).
// Úsalo en Orders, Customers, reportes y gráficos para no redefinir colores.
export const ORDER_STATUS_TONE = {
  "Pendiente de pago": "pending",
  "Pendiente de validación": "validating",
  "Aprobada": "approved",
  "Pago Completado": "approved",
  "Entregada": "delivered",
  "Cancelada": "cancelled",
};

export const statusTone = (status) => ORDER_STATUS_TONE[status] || "neutral";

// Color sólido (texto/primer plano AA) de cada tono, para gráficos.
export const STATUS_TONE_COLOR = {
  pending: "var(--state-pending-fg)",
  validating: "var(--state-validating-fg)",
  approved: "var(--state-approved-fg)",
  delivered: "var(--state-delivered-fg)",
  cancelled: "var(--state-cancelled-fg)",
  neutral: "var(--color-ink-soft)",
};

export const statusColor = (status) => STATUS_TONE_COLOR[statusTone(status)];

// Ciclo normal de una orden (para el stepper del detalle).
export const ORDER_FLOW = ["Pendiente de pago", "Pendiente de validación", "Aprobada", "Entregada"];

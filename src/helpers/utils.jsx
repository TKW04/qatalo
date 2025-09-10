export const formatted = (value) => {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const getStatusStyle = (status) => {
  switch (status) {
    case "Aprobada":
      return { color: "green" };
    case "Pendiente de pago":
      return { color: "var(--chart-5)" };
    case "Pendiente de validación":
      return { color: "var(--color-blue)" };
    case "Cancelada":
      return { color: "red" };
    default:
      return { color: "black" };
  }
};

export const formatDate = (dateString) => {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

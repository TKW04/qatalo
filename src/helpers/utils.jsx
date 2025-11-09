export const formatted = (value) => {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const getStatusStyle = (status) => {
  switch (status) {
    case "Aprobada":
    case "Pago Completado":
      return { color: "green" };
    case "Pendiente de pago":
      return { color: "var(--chart-5)" };
    case "Pendiente de validación":
      return { color: "var(--color-sea)" };
    case "Cancelada":
      return { color: "red" };
    default:
      return { color: "black" };
  }
};

export const formatDate = (dateString) => {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateString).toLocaleDateString("es-ES", options);
};
export const formatTextDate = (dateString) => {
  const dates = dateString.split("/");

  const date = new Date(dates[2], dates[1] - 1, dates[0]);
  const weekday = date.toLocaleString("es-ES", { weekday: "long" });

  // Convert the weekday to uppercase
  const capitalizedWeekday = weekday[0].toUpperCase() + weekday.slice(1);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return `${capitalizedWeekday}, ${date.toLocaleDateString("es-ES", options)}`;
};
export const formatTextDateShort = (dateString) => {
  const dates = dateString.split("/");

  const date = new Date(dates[2], dates[1] - 1, dates[0]);
  return date.toLocaleDateString("es-ES");
};
export const currencies = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "DOP", name: "Peso dominicano", symbol: "RD$" },
];
export const getAges = () => {
  const ages = [];
  for (let i = 0; i <= 100; i++) {
    ages.push({
      code: i,
      name: i,
    });
  }
  return ages;
};

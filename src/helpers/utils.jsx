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
    case "Entregada":
      return { color: "var(--chart-2)" };
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
// Reemplaza el array `currencies` en helpers/utils.js por este.
// Se agregó el campo `region` para agrupar en el dropdown.
// El resto de utils.js (formatted, etc.) queda igual.

export const currencies = [
  // Principales / mercado base
  { code: "DOP", name: "Peso dominicano", symbol: "RD$", region: "Principales" },
  { code: "USD", name: "Dólar estadounidense", symbol: "$", region: "Principales" },
  { code: "EUR", name: "Euro", symbol: "€", region: "Principales" },

  // Centroamérica
  { code: "MXN", name: "Peso mexicano", symbol: "$", region: "Centroamérica" },
  { code: "GTQ", name: "Quetzal guatemalteco", symbol: "Q", region: "Centroamérica" },
  { code: "HNL", name: "Lempira hondureño", symbol: "L", region: "Centroamérica" },
  { code: "NIO", name: "Córdoba nicaragüense", symbol: "C$", region: "Centroamérica" },
  { code: "CRC", name: "Colón costarricense", symbol: "₡", region: "Centroamérica" },
  { code: "PAB", name: "Balboa panameño", symbol: "B/.", region: "Centroamérica" },

  // Caribe
  { code: "CUP", name: "Peso cubano", symbol: "$", region: "Caribe" },

  // Sudamérica
  { code: "COP", name: "Peso colombiano", symbol: "$", region: "Sudamérica" },
  { code: "VES", name: "Bolívar venezolano", symbol: "Bs.", region: "Sudamérica" },
  { code: "PEN", name: "Sol peruano", symbol: "S/", region: "Sudamérica" },
  { code: "BOB", name: "Boliviano", symbol: "Bs.", region: "Sudamérica" },
  { code: "CLP", name: "Peso chileno", symbol: "$", region: "Sudamérica" },
  { code: "ARS", name: "Peso argentino", symbol: "$", region: "Sudamérica" },
  { code: "PYG", name: "Guaraní paraguayo", symbol: "₲", region: "Sudamérica" },
  { code: "UYU", name: "Peso uruguayo", symbol: "$U", region: "Sudamérica" },
  { code: "BRL", name: "Real brasileño", symbol: "R$", region: "Sudamérica" },
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

export const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1);

  const weekday = date.toLocaleString("es-ES", { month: "long" });
  const capitalizedWeekday = weekday[0].toUpperCase() + weekday.slice(1);
  return capitalizedWeekday;
};

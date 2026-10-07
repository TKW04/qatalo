import { curSymbol } from "../../helpers/utils";

// Formato de precio único para tarjetas y modal del catálogo.
export const formatPrice = (price) =>
  Number(price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// "RD$ 1,250.00" (símbolo de la moneda, igual en todas las plantillas)
export const priceLabel = (price, currency) => `${curSymbol(currency)} ${formatPrice(price)}`.trim();

// ¿El producto tiene variantes con precios distintos? (misma regla que ProductModal)
export const hasPriceRange = (product) => {
  if (!product?.is_customizable || !product?.variants?.length) return false;
  if (product.variant_type === "size") {
    const prices = new Set(product.variants.map((v) => Number(v.price || 0)));
    return prices.size > 1;
  }
  return product.variants.some((v) => Number(v.extra_price) > 0);
};

// Las primeras N imágenes del catálogo se cargan con prioridad (LCP móvil).
export const PRIORITY_IMAGES = 4;

// Precio más bajo entre variantes (igual que "lowestPrice" del modal).
export const lowestPrice = (product) => {
  if (!product?.is_customizable || !product?.variants?.length) return Number(product?.price);
  if (product.variant_type === "size") return Math.min(...product.variants.map((v) => Number(v.price || 0)));
  return Math.min(...product.variants.map((v) => Number(product.price) + Number(v.extra_price || 0)));
};

// Texto de precio para tarjeta: "Desde RD$ X" solo si hay rango real.
export const cardPriceLabel = (product) =>
  hasPriceRange(product)
    ? `Desde ${priceLabel(lowestPrice(product), product.currency)}`
    : priceLabel(product.price, product.currency);

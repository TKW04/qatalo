export const DUMMY_CATEGORIES = [
  { category_id: "cat-1", name: "Destacados" },
  { category_id: "cat-2", name: "Novedades" },
  { category_id: "cat-3", name: "Ofertas" },
];

export const DUMMY_PRODUCTS = [
  {
    product_id: "p-1", name: "Auriculares Pro", currency: "$", price: 199.99,
    category_id: "cat-1", is_available: "available", quantity: 12, show_quantity: true,
    imagesUrl: [{ image: "https://placehold.co/400x400?text=Producto+1" }],
  },
  {
    product_id: "p-2", name: "Mochila Urbana", currency: "$", price: 89.5,
    category_id: "cat-2", is_available: "available", quantity: 5, show_quantity: true,
    imagesUrl: [{ image: "https://placehold.co/400x400?text=Producto+2" }],
  },
  {
    product_id: "p-3", name: "Reloj Minimalista", currency: "$", price: 149.0,
    category_id: "cat-3", is_available: "available", quantity: 0, show_quantity: false,
    imagesUrl: [{ image: "https://placehold.co/400x400?text=Producto+3" }],
  },
  {
    product_id: "p-4", name: "Lámpara LED", currency: "$", price: 45.99,
    category_id: "cat-1", is_available: "unavailable", quantity: 0, show_quantity: false,
    imagesUrl: [{ image: "https://placehold.co/400x400?text=Agotado" }],
  },
  {
    product_id: "p-5", name: "Botella Térmica", currency: "$", price: 29.99,
    category_id: "cat-2", is_available: "available", quantity: 30, show_quantity: true,
    imagesUrl: [{ image: "https://placehold.co/400x400?text=Producto+5" }],
  },
];
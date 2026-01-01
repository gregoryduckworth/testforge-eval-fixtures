const NAMES = ['Kettle', 'Toaster', 'Teapot', 'Mug', 'Coffee grinder', 'Milk frother', 'Tea strainer', 'Cafetière'];

/** 120 products: each name above, numbered 1 to 15. */
export const PRODUCTS = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  name: `${NAMES[i % NAMES.length]} ${Math.floor(i / NAMES.length) + 1}`,
  priceCents: 500 + ((i * 137) % 4500),
  stock: (i * 7) % 13,
}));

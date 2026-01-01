/** What the shop sells, by id. Prices are in cents. */
export const PRODUCTS = [
  {
    id: 'kettle',
    name: 'Stovetop kettle',
    priceCents: 3400,
    blurb: 'Enamelled steel, 1.5 litres, whistles when it boils.',
  },
  {
    id: 'teapot',
    name: 'Cast-iron teapot',
    priceCents: 4800,
    blurb: 'Keeps a pot warm for an hour. Comes with an infuser.',
  },
  { id: 'mugs', name: 'Set of two mugs', priceCents: 1800, blurb: 'Stoneware, 350 ml each, dishwasher safe.' },
];

export function findProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

export function formatPrice(cents) {
  return `£${(cents / 100).toFixed(2)}`;
}

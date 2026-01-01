/** The lines of an order the stock can't cover, with how many are short (by SKU). */
export function shortages(lines, stock) {
  return lines
    .map((line) => ({ sku: line.sku, short: line.quantity - (stock[line.sku] ?? 0) }))
    .filter((line) => line.short > 0);
}

/** Whether the stock covers every line of the order. */
export function inStock(lines, stock) {
  return shortages(lines, stock).length === 0;
}

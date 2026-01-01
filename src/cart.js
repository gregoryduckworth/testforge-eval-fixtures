/** A line's total in pence: its unit price times its quantity. */
export function lineTotal(line) {
  if (!Number.isInteger(line.quantity) || line.quantity < 1) {
    throw new RangeError(`A line needs a whole quantity of at least 1, not ${line.quantity}.`);
  }
  return line.unitPence * line.quantity;
}

/** The basket's subtotal in pence, before any discount. */
export function subtotal(lines) {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

/** How many items the basket holds, across its lines. */
export function itemCount(lines) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

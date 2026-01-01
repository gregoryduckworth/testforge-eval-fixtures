/** An amount in pence as the shop shows it: £12.50. */
export function formatPence(pence) {
  const sign = pence < 0 ? '-' : '';
  const abs = Math.abs(pence);
  const pounds = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, '0');
  return `${sign}£${pounds}.${rest}`;
}

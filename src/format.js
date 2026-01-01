const POUND = '£';

/** An amount in pence as the shop shows it: £12.50. */
export function formatPence(pence) {
  const abs = Math.abs(pence);
  const text = `${POUND}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
  return pence < 0 ? `-${text}` : text;
}

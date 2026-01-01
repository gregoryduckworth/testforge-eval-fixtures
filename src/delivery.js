/** How long each delivery method takes, in working days. */
export const DELIVERY_METHODS = {
  standard: { label: 'Standard', days: 4 },
  express: { label: 'Express', days: 1 },
};

/** The working day a parcel sent on `from` arrives, `days` working days later. */
export function arrivalDate(from, days) {
  const date = new Date(from);
  let left = days;
  while (left > 0) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) left--;
  }
  return date;
}

/** "Arrives by Thursday 8 January" for an order sent today by `method`. */
export function deliveryEstimate(method, today = new Date()) {
  const { days } = DELIVERY_METHODS[method];
  const date = arrivalDate(today, days);
  return `Arrives by ${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`;
}

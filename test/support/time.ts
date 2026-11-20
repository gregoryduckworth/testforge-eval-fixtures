/** A time on 2 March 2026, in UTC: at('09:30') or at('09:00:30'). */
export const at = (time: string): Date => new Date(`2026-03-02T${time.length === 5 ? `${time}:00` : time}Z`);

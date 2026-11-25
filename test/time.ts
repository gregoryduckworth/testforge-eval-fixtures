/** A time on 2 March 2026, in UTC: `HH:MM`, or `HH:MM:SS.mmm` for times off the minute. */
export const at = (time: string): Date => new Date(`2026-03-02T${time.length === 5 ? `${time}:00` : time}Z`);

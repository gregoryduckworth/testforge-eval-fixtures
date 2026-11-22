// Every impact axe reports, from minor up: a page that passes clean is guarded at all of them.
const GUARDED_IMPACTS = ['minor', 'moderate', 'serious', 'critical'];

/**
 * Keeps the violations of an axe result that have a guarded impact, as
 * { id, impact, help, targets }, so a failing toEqual([]) names each rule and
 * the elements it failed on.
 */
export function guardedViolations(results) {
  return results.violations
    .filter((violation) => GUARDED_IMPACTS.includes(violation.impact))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target.join(' ')),
    }));
}

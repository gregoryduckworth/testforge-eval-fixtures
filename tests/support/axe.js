// Every impact axe reports, from minor up: a guarded page must have none of them.
const GUARDED_IMPACTS = ['minor', 'moderate', 'serious', 'critical'];

/**
 * Takes axe's results and returns its violations at the guarded impacts, each
 * as its rule id, impact and the elements it failed on, so a failing
 * assertion names what to fix.
 */
export function guardedViolations(results) {
  return results.violations
    .filter((violation) => GUARDED_IMPACTS.includes(violation.impact))
    .map((violation) => ({
      rule: violation.id,
      impact: violation.impact,
      help: violation.help,
      elements: violation.nodes.map((node) => node.target.join(' ')),
    }));
}

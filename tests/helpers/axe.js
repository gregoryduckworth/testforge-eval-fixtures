/** Impacts the axe checks guard, from the least severe up. */
export const GUARDED_IMPACTS = ['minor', 'moderate', 'serious', 'critical'];

/**
 * Picks the violations at a guarded impact from axe results, each reduced to
 * its rule id, impact, help and failing elements so an assertion failure names
 * what to fix.
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

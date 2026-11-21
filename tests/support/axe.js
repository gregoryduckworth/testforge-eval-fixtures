// Every impact axe assigns, from minor up: a guarded page fails on any of them.
const GUARDED_IMPACTS = ['minor', 'moderate', 'serious', 'critical'];

/**
 * Picks the violations rated minor or worse from an axe result, each as its
 * rule id, impact, help text and the elements it failed on, so an assertion
 * failure names what broke.
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

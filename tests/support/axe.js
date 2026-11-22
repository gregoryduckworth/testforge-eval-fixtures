const GUARDED_IMPACTS = ['minor', 'moderate', 'serious', 'critical'];

/**
 * Takes the results of an axe scan and returns the violations rated minor or
 * worse, each as its rule id, impact, help text and the selectors of the
 * elements it failed on, so a failing assertion names them.
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

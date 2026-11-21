const IMPACTS = ['minor', 'moderate', 'serious', 'critical'];

// Takes the results of an axe scan (AxeBuilder.analyze()) and returns each violation
// of minor impact or worse as its rule id, impact and the elements it failed on,
// so a failing assertion names them.
export function violationsOfMinorOrWorse(results) {
  return results.violations
    .filter((violation) => IMPACTS.includes(violation.impact))
    .map((violation) => ({
      rule: violation.id,
      impact: violation.impact,
      elements: violation.nodes.map((node) => node.target.join(' ')),
    }));
}

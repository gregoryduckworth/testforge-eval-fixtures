/** Runs `act` once and returns what it threw, or undefined when it didn't throw. */
export function thrownBy(act) {
  try {
    act();
  } catch (caught) {
    return caught;
  }
  return undefined;
}

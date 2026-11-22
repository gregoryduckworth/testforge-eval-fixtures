/** The error `fn` throws; fails the test when it returns instead. */
export function thrownBy(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the call to throw, but it returned.');
}

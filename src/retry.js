const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * How long to wait before retry number `attempt` (from 0): `baseMs` doubled for each earlier retry,
 * plus up to `jitterMs` of random jitter, so clients that failed together don't all come back at
 * the same moment.
 */
export function retryDelay(attempt, { baseMs = 20, jitterMs = 40, random = Math.random } = {}) {
  return baseMs * 2 ** attempt + Math.floor(random() * jitterMs);
}

/**
 * Calls `task` until it succeeds, at most `attempts` times, waiting `retryDelay` between calls.
 * Resolves with the first result; rejects with the last error once every attempt has failed.
 */
export async function retry(task, { attempts = 3, baseMs = 20, jitterMs = 40, random = Math.random } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await sleep(retryDelay(attempt, { baseMs, jitterMs, random }));
    }
  }
  throw lastError;
}

// SYNC-21: TC1
import { describe, expect, it, vi } from 'vitest';
import { retry, retryDelay } from '../src/retry.js';

describe('retryDelay', () => {
  it('doubles the base delay for each earlier retry', () => {
    const noJitter = () => 0;
    expect(retryDelay(0, { random: noJitter })).toBe(20);
    expect(retryDelay(1, { random: noJitter })).toBe(40);
    expect(retryDelay(2, { random: noJitter })).toBe(80);
  });

  it('adds at most the jitter on top', () => {
    expect(retryDelay(0, { random: () => 0.999 })).toBe(59);
  });
});

describe('retry', () => {
  it('resolves with the first result when the call succeeds', async () => {
    const task = vi.fn().mockResolvedValue('ok');
    await expect(retry(task)).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('retries a failed call after a back-off', async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error('busy')).mockResolvedValue('ok');
    const result = retry(task);
    // The back-off is 20ms plus up to 39ms of random jitter, so wait for the second call itself
    // rather than a fixed time the back-off can outlast.
    await vi.waitFor(() => expect(task).toHaveBeenCalledTimes(2));
    await expect(result).resolves.toBe('ok');
  });

  it('rejects with the last error once every attempt has failed', async () => {
    const task = vi.fn().mockRejectedValue(new Error('down'));
    await expect(retry(task, { attempts: 2, baseMs: 1, jitterMs: 1 })).rejects.toThrow('down');
    expect(task).toHaveBeenCalledTimes(2);
  });
});

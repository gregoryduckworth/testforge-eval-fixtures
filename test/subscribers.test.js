// SYNC-21: TC2
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { publish, subscribe } from '../src/subscribers.js';

// src/subscribers.js keeps one handler list for the whole process, so every test removes the
// subscriptions it makes, even when it fails, and no later test finds them.
function subscribeForTest(topic, handler) {
  const stop = subscribe(topic, handler);
  onTestFinished(stop);
  return stop;
}

describe('subscribers', () => {
  it('stops telling a handler once it unsubscribes', () => {
    const handler = vi.fn();
    const stop = subscribeForTest('records', handler);
    stop();
    expect(publish('records', { id: 'rec-1' })).toBe(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it('tells every handler subscribed to the topic', () => {
    const first = vi.fn();
    const second = vi.fn();
    subscribeForTest('records', first);
    subscribeForTest('records', second);
    expect(publish('records', { id: 'rec-1' })).toBe(2);
    expect(first).toHaveBeenCalledWith({ id: 'rec-1' });
    expect(second).toHaveBeenCalledWith({ id: 'rec-1' });
  });

  it('tells nobody about a topic no handler follows', () => {
    expect(publish('audits', { id: 'rec-1' })).toBe(0);
  });
});

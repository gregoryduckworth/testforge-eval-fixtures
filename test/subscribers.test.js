// SYNC-21: TC2
import { afterEach, describe, expect, it, vi } from 'vitest';
import { publish, subscribe } from '../src/subscribers.js';

describe('subscribers', () => {
  // The handler list is shared by the whole process, so every test unsubscribes what it
  // subscribed: a handler left behind would be told about the next test's messages.
  let stops = [];
  const follow = (topic, handler) => {
    const stop = subscribe(topic, handler);
    stops.push(stop);
    return stop;
  };

  afterEach(() => {
    for (const stop of stops) stop();
    stops = [];
  });

  it('stops telling a handler once it unsubscribes', () => {
    const handler = vi.fn();
    const stop = follow('records', handler);
    stop();
    expect(publish('records', { id: 'rec-1' })).toBe(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it('tells every handler subscribed to the topic', () => {
    const first = vi.fn();
    const second = vi.fn();
    follow('records', first);
    follow('records', second);
    expect(publish('records', { id: 'rec-1' })).toBe(2);
    expect(first).toHaveBeenCalledWith({ id: 'rec-1' });
    expect(second).toHaveBeenCalledWith({ id: 'rec-1' });
  });

  it('tells nobody about a topic no handler follows', () => {
    expect(publish('audits', { id: 'rec-1' })).toBe(0);
  });
});

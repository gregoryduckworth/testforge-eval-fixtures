import { describe, expect, it, vi } from 'vitest';
import { publish, subscribe } from '../src/subscribers.js';

describe('subscribers', () => {
  it('stops telling a handler once it unsubscribes', () => {
    const handler = vi.fn();
    const stop = subscribe('records', handler);
    stop();
    expect(publish('records', { id: 'rec-1' })).toBe(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it('tells every handler subscribed to the topic', () => {
    const first = vi.fn();
    const second = vi.fn();
    subscribe('records', first);
    subscribe('records', second);
    expect(publish('records', { id: 'rec-1' })).toBe(2);
    expect(first).toHaveBeenCalledWith({ id: 'rec-1' });
    expect(second).toHaveBeenCalledWith({ id: 'rec-1' });
  });

  it('tells nobody about a topic no handler follows', () => {
    expect(publish('audits', { id: 'rec-1' })).toBe(0);
  });
});

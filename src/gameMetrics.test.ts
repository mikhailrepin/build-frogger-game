import { describe, expect, it, beforeEach } from 'vitest';
import { drainGameEvents, recordGameEvent, resetGameEvents } from './gameMetrics';

describe('game metrics', () => {
  beforeEach(() => {
    resetGameEvents();
  });

  it('records and drains events in order', () => {
    recordGameEvent('start', { level: 1 });
    recordGameEvent('restart');

    const events = drainGameEvents();

    expect(events.map((event) => event.type)).toEqual(['start', 'restart']);
    expect(events[0]?.data).toMatchObject({ level: 1 });
    expect(drainGameEvents()).toEqual([]);
  });
});

export type GameEventType =
  | 'start'
  | 'first_move'
  | 'death'
  | 'restart'
  | 'goal'
  | 'level_complete'
  | 'game_over'
  | 'ability_used';

export interface GameEvent {
  type: GameEventType;
  at: number;
  data?: Record<string, unknown>;
}

const events: GameEvent[] = [];

export function recordGameEvent(type: GameEventType, data: Record<string, unknown> = {}) {
  events.push({
    type,
    at: performance.now(),
    data,
  });
}

export function drainGameEvents() {
  return events.splice(0, events.length);
}

export function resetGameEvents() {
  events.splice(0, events.length);
}

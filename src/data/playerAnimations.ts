export const PLAYER_ANIMATION_ROWS = {
  left: 0,
  right: 1,
  up: 2,
  down: 3,
} as const;

export const FRAMES_PER_DIRECTION = 5;

export function frameRange(row: number): { start: number; end: number } {
  const start = row * FRAMES_PER_DIRECTION;
  return { start, end: start + FRAMES_PER_DIRECTION - 1 };
}

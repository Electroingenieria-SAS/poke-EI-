import type { CreatureDefinition } from '../types/game';

export const CREATURES: Record<string, CreatureDefinition> = {
  mossling: {
    id: 'mossling', name: 'Mossling', assetKey: 'creature-mossling',
    maxHp: 36, maxStamina: 10, attack: 8, defense: 4, xp: 18, captureRate: 0.58
  },
  pebblit: {
    id: 'pebblit', name: 'Pebblit', assetKey: 'creature-pebblit',
    maxHp: 44, maxStamina: 8, attack: 7, defense: 7, xp: 21, captureRate: 0.46
  },
  cinderkin: {
    id: 'cinderkin', name: 'Cinderkin', assetKey: 'campfire',
    maxHp: 32, maxStamina: 12, attack: 10, defense: 3, xp: 24, captureRate: 0.38, animated: true
  },
  slatewarden: {
    id: 'slatewarden', name: 'Guardián de Pizarra', assetKey: 'creature-boss',
    maxHp: 92, maxStamina: 14, attack: 13, defense: 9, xp: 70, captureRate: 0, boss: true
  }
};

export const WORLD_ENCOUNTERS = ['mossling', 'pebblit', 'cinderkin'];

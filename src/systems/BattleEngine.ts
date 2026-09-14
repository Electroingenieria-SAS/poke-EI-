import Phaser from 'phaser';
import type { CreatureDefinition } from '../types/game';

export interface CombatantState {
  hp: number;
  stamina: number;
}

export const scaledHp = (base: number, level: number) => base + (level - 1) * 6;

export function damage(attacker: CreatureDefinition, defender: CreatureDefinition, level: number, power = 1): number {
  const variance = Phaser.Math.FloatBetween(0.9, 1.1);
  const raw = ((attacker.attack + level * 1.8) * power - defender.defense * 0.55) * variance;
  return Math.max(2, Math.round(raw));
}

export function captureChance(enemy: CreatureDefinition, enemyHp: number, enemyMaxHp: number): number {
  if (enemy.boss || enemy.captureRate <= 0) return 0;
  const weakened = 1 - enemyHp / enemyMaxHp;
  return Phaser.Math.Clamp(enemy.captureRate * (0.55 + weakened * 1.25), 0.08, 0.92);
}

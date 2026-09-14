export type Direction = 'down' | 'left' | 'right' | 'up';

export interface CreatureDefinition {
  id: string;
  name: string;
  assetKey: string;
  maxHp: number;
  maxStamina: number;
  attack: number;
  defense: number;
  xp: number;
  captureRate: number;
  boss?: boolean;
  animated?: boolean;
}

export interface PartyMember {
  creatureId: string;
  level: number;
  xp: number;
}

export interface GameSave {
  playerLevel: number;
  playerXp: number;
  party: PartyMember[];
  questStage: number;
  runeSequence: string[];
  flags: Record<string, boolean>;
  lastWorldPosition: { x: number; y: number };
  lastDungeonPosition: { x: number; y: number };
}

export interface CollisionRect {
  x: number;
  y: number;
  w: number;
  h: number;
  source: string;
}

export interface WorldObjectData {
  id: number;
  gid: number;
  x: number;
  y: number;
  width: number;
  height: number;
  bottom: number;
  asset: string;
  kind: string;
  frame?: number;
}

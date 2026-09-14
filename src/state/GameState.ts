import { SAVE_KEY } from '../config/constants';
import type { GameSave, PartyMember } from '../types/game';

const defaultState = (): GameSave => ({
  playerLevel: 1,
  playerXp: 0,
  party: [{ creatureId: 'mossling', level: 1, xp: 0 }],
  questStage: 0,
  runeSequence: [],
  flags: {},
  lastWorldPosition: { x: 330, y: 265 },
  lastDungeonPosition: { x: 120, y: 500 }
});

class GameStateStore {
  private state: GameSave = defaultState();

  load(): GameSave {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.state = raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    } catch {
      this.state = defaultState();
    }
    return this.state;
  }

  reset(): void {
    this.state = defaultState();
    this.save();
  }

  get snapshot(): GameSave { return this.state; }

  patch(values: Partial<GameSave>): void {
    this.state = { ...this.state, ...values };
    this.save();
  }

  setFlag(key: string, value = true): void {
    this.state.flags[key] = value;
    this.save();
  }

  hasFlag(key: string): boolean { return Boolean(this.state.flags[key]); }

  addRune(id: string): 'correct' | 'wrong' | 'complete' {
    const expected = ['SOL', 'RÍO', 'RAÍZ'];
    const nextIndex = this.state.runeSequence.length;
    if (expected[nextIndex] !== id) {
      this.state.runeSequence = [];
      this.save();
      return 'wrong';
    }
    this.state.runeSequence.push(id);
    if (this.state.runeSequence.length === expected.length) {
      this.state.flags.runesSolved = true;
      this.state.questStage = Math.max(this.state.questStage, 2);
      this.save();
      return 'complete';
    }
    this.save();
    return 'correct';
  }

  grantXp(amount: number): { leveled: boolean; level: number } {
    this.state.playerXp += amount;
    let leveled = false;
    while (this.state.playerXp >= this.xpToNext()) {
      this.state.playerXp -= this.xpToNext();
      this.state.playerLevel += 1;
      leveled = true;
    }
    this.save();
    return { leveled, level: this.state.playerLevel };
  }

  xpToNext(): number { return 40 + (this.state.playerLevel - 1) * 22; }

  addPartyMember(member: PartyMember): boolean {
    if (this.state.party.some(p => p.creatureId === member.creatureId)) return false;
    if (this.state.party.length >= 6) return false;
    this.state.party.push(member);
    this.save();
    return true;
  }

  save(): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
  }
}

export const gameState = new GameStateStore();

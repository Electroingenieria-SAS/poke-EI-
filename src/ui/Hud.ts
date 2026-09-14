import Phaser from 'phaser';
import { gameState } from '../state/GameState';

export class Hud {
  private text: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene) {
    const bg = scene.add.rectangle(18, 18, 300, 84, 0x07110d, 0.78).setOrigin(0).setStrokeStyle(2, 0x86b990).setDepth(9000).setScrollFactor(0);
    this.text = scene.add.text(32, 28, '', { fontFamily: 'monospace', fontSize: '15px', color: '#f2f5e9', lineSpacing: 5 }).setDepth(9001).setScrollFactor(0);
    bg.setInteractive({ useHandCursor: false });
    this.refresh();
  }
  refresh(): void {
    const s = gameState.snapshot;
    const objective = s.flags.bossDefeated ? 'Misión completada' : s.flags.runesSolved ? 'Entra al santuario del sur' : s.questStage > 0 ? 'Activa SOL → RÍO → RAÍZ' : 'Habla con Iria';
    this.text.setText([`NIVEL ${s.playerLevel}   XP ${s.playerXp}/${gameState.xpToNext()}`, `Equipo: ${s.party.length}/6`, `Objetivo: ${objective}`]);
  }
}

import Phaser from 'phaser';
import { gameState } from '../state/GameState';

export class Hud {
  private objectiveText: Phaser.GameObjects.Text;
  private statsText: Phaser.GameObjects.Text;
  private runeText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const objectivePanel = scene.add.graphics().setScrollFactor(0).setDepth(9000);
    objectivePanel.fillStyle(0x0b1712, 0.88).fillRoundedRect(18, 18, 330, 74, 12);
    objectivePanel.lineStyle(1, 0xd7c48c, 0.45).strokeRoundedRect(18.5, 18.5, 329, 73, 12);

    scene.add.text(34, 29, 'OBJETIVO ACTUAL', {
      fontFamily: 'Verdana, sans-serif', fontSize: '10px', color: '#d7c48c', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(9001);
    this.objectiveText = scene.add.text(34, 49, '', {
      fontFamily: 'Verdana, sans-serif', fontSize: '15px', color: '#fff8e7', wordWrap: { width: 292 }
    }).setScrollFactor(0).setDepth(9001);

    const statsPanel = scene.add.graphics().setScrollFactor(0).setDepth(9000);
    statsPanel.fillStyle(0x0b1712, 0.82).fillRoundedRect(18, 462, 246, 58, 12);
    statsPanel.lineStyle(1, 0x89b58f, 0.35).strokeRoundedRect(18.5, 462.5, 245, 57, 12);
    this.statsText = scene.add.text(34, 476, '', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: '#e7f0e6', lineSpacing: 5
    }).setScrollFactor(0).setDepth(9001);

    this.runeText = scene.add.text(936, 26, '', {
      fontFamily: 'Verdana, sans-serif', fontSize: '11px', color: '#f3e5a8', align: 'right',
      backgroundColor: '#0b1712cc', padding: { x: 10, y: 7 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(9001);

    this.refresh();
  }

  refresh(): void {
    const s = gameState.snapshot;
    const objective = s.flags.bossDefeated
      ? 'El santuario ha quedado en calma.'
      : s.flags.runesSolved
        ? 'Regresa al santuario del sur.'
        : s.questStage > 0
          ? 'Haz resonar SOL → RÍO → RAÍZ.'
          : 'Busca a Iria en la plaza central.';
    this.objectiveText.setText(objective);
    this.statsText.setText(`Nv. ${s.playerLevel}   XP ${s.playerXp}/${gameState.xpToNext()}\nCompañeros ${s.party.length}/6`);
    const sequence = s.runeSequence.length ? s.runeSequence.join('  ›  ') : '—';
    this.runeText.setText(`RUNAS  ${sequence}`);
  }
}

import Phaser from 'phaser';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../config/constants';
import { gameState } from '../state/GameState';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create(): void {
    const bg = this.add.image(VIEW_WIDTH / 2, 365, 'world-map').setScale(1.5);
    this.tweens.add({ targets: bg, y: 350, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, 0x07100c, 0.42);
    this.add.rectangle(VIEW_WIDTH / 2, 90, VIEW_WIDTH, 180, 0x07100c, 0.56);
    this.add.rectangle(VIEW_WIDTH / 2, 475, VIEW_WIDTH, 130, 0x07100c, 0.62);

    this.add.text(VIEW_WIDTH / 2, 95, 'ECHOES OF ALDER', {
      fontFamily: 'Georgia, serif', fontSize: '52px', color: '#fff0bd', fontStyle: 'bold',
      stroke: '#17231b', strokeThickness: 7
    }).setOrigin(0.5);
    this.add.text(VIEW_WIDTH / 2, 145, 'A MONSTER-TAMING ADVENTURE', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: '#d7e6cf'
    }).setOrigin(0.5);

    const startBg = this.add.graphics();
    startBg.fillStyle(0x12281e, 0.94).fillRoundedRect(336, 416, 288, 58, 12);
    startBg.lineStyle(1, 0xe4ce85, 0.55).strokeRoundedRect(336.5, 416.5, 287, 57, 12);
    const start = this.add.text(VIEW_WIDTH / 2, 445, 'CONTINUAR  ·  ENTER', {
      fontFamily: 'Verdana, sans-serif', fontSize: '16px', color: '#fff8df', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const reset = this.add.text(VIEW_WIDTH / 2, 495, 'R · Nueva partida', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: '#d7ddd5'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const go = () => this.scene.start('WorldScene');
    start.on('pointerdown', go);
    reset.on('pointerdown', () => { gameState.reset(); go(); });
    this.input.keyboard!.on('keydown-ENTER', go);
    this.input.keyboard!.on('keydown-R', () => { gameState.reset(); go(); });
  }
}

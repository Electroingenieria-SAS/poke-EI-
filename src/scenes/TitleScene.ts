import Phaser from 'phaser';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../config/constants';
import { gameState } from '../state/GameState';

export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create(): void {
    this.add.image(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 'world-map').setDisplaySize(VIEW_WIDTH, VIEW_WIDTH).setTint(0x748874);
    this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, 0x06100c, 0.55);
    this.add.text(VIEW_WIDTH / 2, 160, 'ECHOES OF ALDER', {
      fontFamily: 'monospace', fontSize: '48px', color: '#f2da7b', fontStyle: 'bold', stroke: '#253621', strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(VIEW_WIDTH / 2, 218, 'Vertical slice · Phaser 3 + Tiled assets', { fontFamily: 'monospace', fontSize: '18px', color: '#dbe6d6' }).setOrigin(0.5);

    const start = this.add.text(VIEW_WIDTH / 2, 330, '[ ENTER ]  CONTINUAR', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff', backgroundColor: '#18382b', padding: { x: 18, y: 12 } })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const reset = this.add.text(VIEW_WIDTH / 2, 392, '[ R ]  NUEVA PARTIDA', { fontFamily: 'monospace', fontSize: '17px', color: '#c7d5ca' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const go = () => this.scene.start('WorldScene');
    start.on('pointerdown', go);
    reset.on('pointerdown', () => { gameState.reset(); go(); });
    this.input.keyboard!.on('keydown-ENTER', go);
    this.input.keyboard!.on('keydown-R', () => { gameState.reset(); go(); });
  }
}

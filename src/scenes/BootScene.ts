import Phaser from 'phaser';
import { RUNTIME_ASSETS } from '../runtime/runtimeAssets';
import { gameState } from '../state/GameState';
import { PLAYER_ANIMATION_ROWS, frameRange } from '../data/playerAnimations';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    const label = this.add.text(480, 250, 'Preparando Alder…', {
      fontFamily: 'Georgia, serif', fontSize: '24px', color: '#f6ecd7'
    }).setOrigin(0.5);
    const rail = this.add.rectangle(480, 292, 360, 8, 0x15251d, 0.9).setOrigin(0.5);
    const bar = this.add.rectangle(302, 292, 4, 4, 0xe0c774).setOrigin(0, 0.5);
    this.load.on('progress', (value: number) => bar.width = 356 * value);
    this.load.on('complete', () => { label.setText('El valle está listo'); rail.setFillStyle(0x15251d, 0.6); });

    this.load.image('world-map', RUNTIME_ASSETS.worldMap);
    this.load.spritesheet('player-walk', RUNTIME_ASSETS.playerWalk, { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('player-idle', RUNTIME_ASSETS.playerIdle, { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('player-slash', RUNTIME_ASSETS.playerSlash, { frameWidth: 48, frameHeight: 48 });
  }

  create(): void {
    this.ensureSupportTextures();
    gameState.load();
    this.createAnimations();
    this.scene.start('TitleScene');
  }

  private ensureSupportTextures(): void {
    this.ensureSheet('campfire', 32, 32, 8, 1, 0xe18b3e);
    this.ensureSheet('ground-tiles', 16, 16, 16, 7, 0x526f52);
    this.ensureImage('creature-mossling', 44, 44, 0x4e9a62, 'M');
    this.ensureImage('creature-pebblit', 44, 44, 0x827a70, 'P');
    this.ensureImage('creature-boss', 60, 60, 0x666c78, 'G');
    this.ensureImage('crate', 32, 32, 0x93683e, '');
    this.ensureImage('sign', 32, 40, 0x8c6d43, '');
    this.ensureImage('rock-wall', 36, 32, 0x74766f, '');
  }

  private ensureSheet(key: string, frameW: number, frameH: number, cols: number, rows: number, color: number): void {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, frameW * cols, frameH * rows);
    if (!tex) return;
    const ctx = tex.context;
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ox = col * frameW;
        const oy = row * frameH;
        ctx.fillStyle = hex;
        ctx.fillRect(ox + 2, oy + 2, frameW - 4, frameH - 4);
        tex.add(index++, 0, ox, oy, frameW, frameH);
      }
    }
    tex.refresh();
  }

  private ensureImage(key: string, width: number, height: number, color: number, glyph: string): void {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, width, height);
    if (!tex) return;
    const ctx = tex.context;
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.beginPath();
    ctx.roundRect(2, 2, width - 4, height - 4, 8);
    ctx.fill();
    if (glyph) {
      ctx.fillStyle = '#f4edcf';
      ctx.font = `bold ${Math.max(12, Math.floor(height * 0.38))}px Verdana`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, width / 2, height / 2);
    }
    tex.refresh();
  }

  private createAnimations(): void {
    const make = (key: string, tex: string, row: number, frameRate: number, repeat = -1) => {
      if (this.anims.exists(key)) return;
      const { start, end } = frameRange(row);
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(tex, { start, end }),
        frameRate,
        repeat,
      });
    };

    make('walk-left', 'player-walk', PLAYER_ANIMATION_ROWS.left, 9);
    make('walk-right', 'player-walk', PLAYER_ANIMATION_ROWS.right, 9);
    make('walk-up', 'player-walk', PLAYER_ANIMATION_ROWS.up, 9);
    make('walk-down', 'player-walk', PLAYER_ANIMATION_ROWS.down, 9);
    make('idle-left', 'player-idle', PLAYER_ANIMATION_ROWS.left, 5);
    make('idle-right', 'player-idle', PLAYER_ANIMATION_ROWS.right, 5);
    make('idle-up', 'player-idle', PLAYER_ANIMATION_ROWS.up, 5);
    make('idle-down', 'player-idle', PLAYER_ANIMATION_ROWS.down, 5);
  }
}

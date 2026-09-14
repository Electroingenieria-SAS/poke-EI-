import Phaser from 'phaser';
import { asset, dataFile } from '../config/assets';
import { WORLD_OBJECT_ASSETS, objectAssetKey } from '../data/objectAssets';
import { gameState } from '../state/GameState';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    const label = this.add.text(480, 250, 'Cargando mundo…', { fontFamily: 'monospace', fontSize: '22px', color: '#f4edcf' }).setOrigin(0.5);
    const barBg = this.add.rectangle(480, 292, 420, 18, 0x15251d).setOrigin(0.5);
    const bar = this.add.rectangle(272, 292, 4, 12, 0xd7c36f).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => bar.width = 412 * v);
    this.load.on('complete', () => { label.setText('Listo'); barBg.setFillStyle(0x15251d); });

    this.load.image('world-map', asset('Tiled/Tilemaps/Beginning Fields.png'));
    this.load.spritesheet('player-walk', asset('Art/Characters/Main Character/Character_Walk.png'), { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('player-idle', asset('Art/Characters/Main Character/Character_Idle.png'), { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('player-slash', asset('Art/Characters/Main Character/Character_Slash.png'), { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('campfire', asset('Art/Props/Animation/Animation_Campfire.png'), { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('ground-tiles', asset('Art/Ground Tileset/Tileset_Ground.png'), { frameWidth: 16, frameHeight: 16 });

    this.load.image('creature-mossling', asset('Art/Trees and Bushes/Bush_Emerald_5.png'));
    this.load.image('creature-pebblit', asset('Art/Rocks/Rock_Brown_4.png'));
    this.load.image('creature-boss', asset('Art/Rocks/Rock_Brown_9.png'));
    this.load.image('crate', asset('Art/Props/Crate_Medium_Closed.png'));
    this.load.image('sign', asset('Art/Props/Sign_2.png'));
    this.load.image('rock-wall', asset('Art/Rocks/Rock_Brown_6.png'));

    this.load.json('world-collisions', dataFile('beginning-fields-collisions.json'));
    this.load.json('world-objects', dataFile('beginning-fields-objects.json'));

    WORLD_OBJECT_ASSETS.forEach(path => this.load.image(objectAssetKey(path), asset(path)));
  }

  create(): void {
    this.ensureFallbackAssets();
    gameState.load();
    this.createAnimations();
    this.scene.start('TitleScene');
  }

  private ensureFallbackAssets(): void {
    if (!this.cache.json.exists('world-collisions')) this.cache.json.add('world-collisions', []);
    if (!this.cache.json.exists('world-objects')) this.cache.json.add('world-objects', []);

    if (!this.textures.exists('world-map')) this.createFallbackWorld();
    this.ensureSheet('player-walk', 32, 48, 5, 4, 0x315c4b);
    this.ensureSheet('player-idle', 32, 48, 5, 4, 0x315c4b);
    this.ensureSheet('player-slash', 48, 48, 6, 4, 0x315c4b);
    this.ensureSheet('campfire', 32, 32, 8, 1, 0xe4863a);
    this.ensureSheet('ground-tiles', 16, 16, 16, 7, 0x596b55);

    this.ensureImage('creature-mossling', 42, 42, 0x4f9a63, 'M');
    this.ensureImage('creature-pebblit', 42, 42, 0x8a8278, 'P');
    this.ensureImage('creature-boss', 58, 58, 0x6c7181, 'G');
    this.ensureImage('crate', 32, 32, 0x93683e, '□');
    this.ensureImage('sign', 32, 40, 0x8c6d43, '!');
    this.ensureImage('rock-wall', 36, 32, 0x74766f, '');
  }

  private createFallbackWorld(): void {
    const tex = this.textures.createCanvas('world-map', 640, 640);
    if (!tex) return;
    const ctx = tex.context;
    ctx.fillStyle = '#567f55';
    ctx.fillRect(0, 0, 640, 640);

    ctx.fillStyle = '#9a845e';
    ctx.fillRect(286, 0, 68, 640);
    ctx.fillRect(0, 286, 640, 68);

    ctx.fillStyle = '#4b83a1';
    ctx.fillRect(70, 0, 38, 640);
    ctx.fillStyle = '#74a65f';
    for (let y = 24; y < 640; y += 72) {
      for (let x = 24; x < 640; x += 72) {
        if ((x > 255 && x < 385) || (y > 255 && y < 385) || (x > 45 && x < 135)) continue;
        ctx.fillRect(x, y, 22, 16);
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let p = 0; p <= 640; p += 32) {
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 640); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(640, p); ctx.stroke();
    }
    tex.refresh();
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
        const bob = col % 2;
        ctx.fillRect(ox + Math.floor(frameW * 0.28), oy + Math.floor(frameH * 0.2) + bob, Math.floor(frameW * 0.44), Math.floor(frameH * 0.58));
        ctx.fillStyle = '#d8c6a0';
        ctx.fillRect(ox + Math.floor(frameW * 0.36), oy + Math.floor(frameH * 0.08) + bob, Math.floor(frameW * 0.28), Math.floor(frameH * 0.2));
        ctx.fillStyle = '#1b2a24';
        ctx.fillRect(ox + Math.floor(frameW * 0.31), oy + Math.floor(frameH * 0.78), Math.max(2, Math.floor(frameW * 0.15)), Math.floor(frameH * 0.16));
        ctx.fillRect(ox + Math.floor(frameW * 0.54), oy + Math.floor(frameH * 0.78), Math.max(2, Math.floor(frameW * 0.15)), Math.floor(frameH * 0.16));
        tex.add(index, 0, ox, oy, frameW, frameH);
        index++;
      }
    }
    tex.refresh();
  }

  private ensureImage(key: string, width: number, height: number, color: number, glyph: string): void {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, width, height);
    if (!tex) return;
    const ctx = tex.context;
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillStyle = hex;
    ctx.fillRect(2, 2, width - 4, height - 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    if (glyph) {
      ctx.fillStyle = '#f4edcf';
      ctx.font = `bold ${Math.max(12, Math.floor(height * 0.45))}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, width / 2, height / 2);
    }
    tex.refresh();
  }

  private createAnimations(): void {
    const make = (key: string, tex: string, start: number, end: number, frameRate: number, repeat = -1) => {
      if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(tex, { start, end }), frameRate, repeat });
    };
    make('walk-down', 'player-walk', 0, 4, 9);
    make('walk-left', 'player-walk', 5, 9, 9);
    make('walk-right', 'player-walk', 10, 14, 9);
    make('walk-up', 'player-walk', 15, 19, 9);
    make('idle-down', 'player-idle', 0, 4, 5);
    make('idle-left', 'player-idle', 5, 9, 5);
    make('idle-right', 'player-idle', 10, 14, 5);
    make('idle-up', 'player-idle', 15, 19, 5);
    make('campfire-loop', 'campfire', 0, 7, 10);
  }
}

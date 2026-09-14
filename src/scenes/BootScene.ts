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
    gameState.load();
    this.createAnimations();
    this.scene.start('TitleScene');
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

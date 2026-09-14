import Phaser from 'phaser';
import type { Direction } from '../types/game';

export class PlayerController {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>;
  private direction: Direction = 'down';
  private readonly speed = 145;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.shadow = scene.add.ellipse(x, y + 18, 27, 10, 0x13291c, 0.28).setDepth(y + 25);
    this.sprite = scene.physics.add.sprite(x, y, 'player-walk', 0).setScale(2).setOrigin(0.5, 0.78);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(15, 10).setOffset(8.5, 35);
    this.sprite.setCollideWorldBounds(true);
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D') as Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>;
  }

  update(blocked = false): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    if (blocked) { this.playIdle(); this.syncDepth(); return false; }

    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) { vx = -1; this.direction = 'left'; }
    else if (this.cursors.right.isDown || this.keys.D.isDown) { vx = 1; this.direction = 'right'; }
    if (this.cursors.up.isDown || this.keys.W.isDown) { vy = -1; this.direction = 'up'; }
    else if (this.cursors.down.isDown || this.keys.S.isDown) { vy = 1; this.direction = 'down'; }

    if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }
    body.setVelocity(vx * this.speed, vy * this.speed);
    if (vx || vy) this.sprite.anims.play(`walk-${this.direction}`, true); else this.playIdle();
    this.syncDepth();
    return Boolean(vx || vy);
  }

  private syncDepth(): void {
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 18).setDepth(this.sprite.y + 23);
    this.sprite.setDepth(this.sprite.y + 48);
  }

  private playIdle(): void { this.sprite.anims.play(`idle-${this.direction}`, true); }
}

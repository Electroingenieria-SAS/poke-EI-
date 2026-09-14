import Phaser from 'phaser';
import { PlayerController } from '../entities/PlayerController';
import { gameState } from '../state/GameState';
import { DialogBox } from '../ui/DialogBox';
import { Hud } from '../ui/Hud';

interface Shrine { id: 'PIEDRA' | 'RAÍZ' | 'LLAMA'; x: number; y: number; glyph: string; }

const SHRINES: Shrine[] = [
  { id: 'RAÍZ', x: 240, y: 430, glyph: '⌘' },
  { id: 'PIEDRA', x: 480, y: 350, glyph: '◆' },
  { id: 'LLAMA', x: 720, y: 430, glyph: '♨' }
];
const ORDER: Shrine['id'][] = ['PIEDRA', 'RAÍZ', 'LLAMA'];

export class DungeonScene extends Phaser.Scene {
  private player!: PlayerController;
  private dialog!: DialogBox;
  private hud!: Hud;
  private keyE!: Phaser.Input.Keyboard.Key;
  private hint!: Phaser.GameObjects.Text;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private gate?: Phaser.Physics.Arcade.Image;
  private sequence: Shrine['id'][] = [];
  private shrineVisuals = new Map<string, Phaser.GameObjects.Arc>();
  private bossSprite?: Phaser.GameObjects.Image;

  constructor() { super('DungeonScene'); }

  create(): void {
    this.physics.world.setBounds(0, 0, 960, 704);
    this.cameras.main.setBackgroundColor('#07100d');
    this.buildFloor();
    this.buildWalls();
    this.buildPuzzle();
    if (gameState.hasFlag('dungeonSealOpen')) this.openGate();
    this.buildBoss();

    const p = gameState.snapshot.lastDungeonPosition;
    this.player = new PlayerController(this, p.x, p.y);
    this.physics.add.collider(this.player.sprite, this.walls);
    this.cameras.main.setBounds(0, 0, 960, 704).startFollow(this.player.sprite, true, 0.1, 0.1);

    this.dialog = new DialogBox(this);
    this.hud = new Hud(this);
    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.hint = this.add.text(0, 0, 'E · INTERACTUAR', { fontFamily: 'monospace', fontSize: '13px', color: '#fff6bd', backgroundColor: '#0c1f18dd', padding: { x: 7, y: 4 } }).setOrigin(0.5).setDepth(9990).setVisible(false);

    this.time.delayedCall(250, () => this.dialog.show('Santuario de Pizarra', [
      'Una inscripción cubre la piedra: “Primero lo que perdura, después lo que crece, al final lo que arde”.',
      'Activa los altares en el orden correcto para romper el sello.'
    ]));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.persistPosition());
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      if (this.dialog.active) this.dialog.advance(); else this.interact();
    }
    this.player.update(this.dialog.active);
    this.updateHint();
  }

  private buildFloor(): void {
    for (let y = 0; y < 22; y++) for (let x = 0; x < 30; x++) {
      const frame = 95 + ((x * 3 + y * 5) % 7 === 0 ? 1 : 0);
      this.add.image(x * 32 + 16, y * 32 + 16, 'ground-tiles', frame).setScale(2).setTint(0x738475).setDepth(0);
    }
    this.add.rectangle(480, 352, 960, 704, 0x111a18, 0.18).setDepth(1);
  }

  private buildWalls(): void {
    this.walls = this.physics.add.staticGroup();
    const addWall = (x: number, y: number, w: number, h: number) => {
      const body = this.walls.create(x, y, 'solid') as Phaser.Physics.Arcade.Image;
      body.setDisplaySize(w, h).setVisible(false).refreshBody();
    };
    addWall(480, 14, 960, 28); addWall(480, 690, 960, 28); addWall(14, 352, 28, 704); addWall(946, 352, 28, 704);
    addWall(185, 255, 250, 28); addWall(775, 255, 250, 28);
    this.gate = this.walls.create(480, 255, 'solid') as Phaser.Physics.Arcade.Image;
    this.gate.setDisplaySize(330, 30).setVisible(false).refreshBody();

    for (let x = 35; x <= 925; x += 62) {
      this.add.image(x, 32, 'rock-wall').setScale(1.6).setTint(0x7f887d).setDepth(40);
      this.add.image(x, 673, 'rock-wall').setScale(1.6).setTint(0x7f887d).setDepth(690);
    }
    for (let y = 86; y <= 630; y += 62) {
      this.add.image(30, y, 'rock-wall').setScale(1.6).setTint(0x7f887d).setDepth(y + 25);
      this.add.image(930, y, 'rock-wall').setScale(1.6).setTint(0x7f887d).setDepth(y + 25);
    }
    this.add.rectangle(480, 255, 330, 28, 0x514a46, 0.95).setStrokeStyle(3, 0xa89673).setDepth(270).setData('seal', true);
  }

  private buildPuzzle(): void {
    for (const shrine of SHRINES) {
      const circle = this.add.circle(shrine.x, shrine.y, 30, 0x29382f, 0.9).setStrokeStyle(3, 0x9cb08e).setDepth(shrine.y + 20);
      this.add.text(shrine.x, shrine.y - 4, shrine.glyph, { fontFamily: 'serif', fontSize: '30px', color: '#ded6a6' }).setOrigin(0.5).setDepth(shrine.y + 21);
      this.add.text(shrine.x, shrine.y + 42, shrine.id, { fontFamily: 'monospace', fontSize: '12px', color: '#cbc9b0' }).setOrigin(0.5).setDepth(shrine.y + 21);
      this.shrineVisuals.set(shrine.id, circle);
    }
  }

  private buildBoss(): void {
    if (gameState.hasFlag('bossDefeated')) {
      this.add.text(480, 132, 'EL SANTUARIO ESTÁ EN CALMA', { fontFamily: 'monospace', fontSize: '18px', color: '#cde5cb' }).setOrigin(0.5).setDepth(500);
      return;
    }
    this.bossSprite = this.add.image(480, 130, 'creature-boss').setScale(4.5).setTint(0xa6aaa4).setDepth(180);
    this.tweens.add({ targets: this.bossSprite, y: 138, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private interact(): void {
    const target = this.nearestTarget();
    if (!target) return;
    if (target.type === 'shrine') {
      this.activateShrine(target.id as Shrine['id']);
      return;
    }
    if (target.type === 'boss') {
      if (!gameState.hasFlag('dungeonSealOpen')) {
        this.dialog.show('Sello', ['La barrera impide acercarte al guardián.']);
        return;
      }
      this.persistPosition();
      this.scene.start('BattleScene', { enemyId: 'slatewarden', returnScene: 'DungeonScene', boss: true });
      return;
    }
    if (target.type === 'exit') {
      gameState.patch({ lastDungeonPosition: { x: 480, y: 610 } });
      this.scene.start('WorldScene');
    }
  }

  private activateShrine(id: Shrine['id']): void {
    if (gameState.hasFlag('dungeonSealOpen')) {
      this.dialog.show(id, ['Este altar ya respondió al ritual.']);
      return;
    }
    const expected = ORDER[this.sequence.length];
    if (id !== expected) {
      this.sequence = [];
      this.shrineVisuals.forEach(v => v.setFillStyle(0x29382f, 0.9));
      this.dialog.show('Ritual roto', ['El santuario retumba y las marcas vuelven a apagarse.']);
      return;
    }
    this.sequence.push(id);
    this.shrineVisuals.get(id)?.setFillStyle(0x4e8966, 0.95);
    if (this.sequence.length === ORDER.length) {
      gameState.setFlag('dungeonSealOpen');
      this.openGate();
      this.dialog.show('Sello roto', ['Piedra, raíz y llama responden. La barrera del guardián desaparece.']);
    } else {
      this.dialog.show(id, [`${id} responde al ritual.`]);
    }
  }

  private openGate(): void {
    if (this.gate) {
      this.walls.remove(this.gate, true, true);
      this.gate = undefined;
    }
    const seal = this.children.getAll().find(c => c.getData('seal')) as Phaser.GameObjects.Rectangle | undefined;
    if (seal) this.tweens.add({ targets: seal, alpha: 0, duration: 500, onComplete: () => seal.destroy() });
  }

  private nearestTarget(): { type: 'shrine' | 'boss' | 'exit'; id: string; x: number; y: number } | undefined {
    const targets: { type: 'shrine' | 'boss' | 'exit'; id: string; x: number; y: number }[] =
      SHRINES.map(s => ({ type: 'shrine', id: s.id, x: s.x, y: s.y }));
    if (!gameState.hasFlag('bossDefeated')) targets.push({ type: 'boss', id: 'boss', x: 480, y: 145 });
    if (gameState.hasFlag('bossDefeated')) targets.push({ type: 'exit', id: 'exit', x: 480, y: 610 });
    return targets
      .map(t => ({ ...t, d: Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, t.x, t.y) }))
      .filter(t => t.d < 90)
      .sort((a, b) => a.d - b.d)[0];
  }

  private updateHint(): void {
    if (this.dialog.active) { this.hint.setVisible(false); return; }
    const target = this.nearestTarget();
    this.hint.setVisible(Boolean(target));
    if (target) this.hint.setPosition(this.player.sprite.x, this.player.sprite.y - 72);
  }

  private persistPosition(): void {
    if (!this.player?.sprite) return;
    gameState.patch({ lastDungeonPosition: { x: this.player.sprite.x, y: this.player.sprite.y } });
  }
}

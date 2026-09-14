import Phaser from 'phaser';
import { MAP_SIZE, WORLD_SCALE, WORLD_SIZE } from '../config/constants';
import { DUNGEON_ENTRANCE, ENCOUNTER_ZONES, NPCS, RUNES } from '../data/world';
import { WORLD_ENCOUNTERS } from '../data/creatures';
import { WORLD_COLLISIONS } from '../data/collisionData';
import { PlayerController } from '../entities/PlayerController';
import { gameState } from '../state/GameState';
import { DialogBox } from '../ui/DialogBox';
import { Hud } from '../ui/Hud';

interface Interactable {
  id: string;
  type: 'npc' | 'rune' | 'entrance';
  x: number;
  y: number;
  label: string;
}

export class WorldScene extends Phaser.Scene {
  private player!: PlayerController;
  private dialog!: DialogBox;
  private hud!: Hud;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private battleKey!: Phaser.Input.Keyboard.Key;
  private debugKey!: Phaser.Input.Keyboard.Key;
  private hint!: Phaser.GameObjects.Text;
  private interactables: Interactable[] = [];
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private collisionGroup!: Phaser.Physics.Arcade.StaticGroup;
  private movedSinceEncounter = 0;
  private lastPlayerPosition = new Phaser.Math.Vector2();
  private encounterCooldown = 0;

  constructor() { super('WorldScene'); }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
    this.add.image(0, 0, 'world-map').setOrigin(0).setScale(WORLD_SCALE).setDepth(0);

    this.ensureSolidTexture();
    this.createCollisionBodies();
    this.createRunesAndEntrance();
    this.createNpcs();

    const pos = gameState.snapshot.lastWorldPosition;
    this.player = new PlayerController(this, pos.x * WORLD_SCALE, pos.y * WORLD_SCALE);
    this.physics.add.collider(this.player.sprite, this.collisionGroup);

    this.cameras.main
      .setBounds(0, 0, WORLD_SIZE, WORLD_SIZE)
      .startFollow(this.player.sprite, true, 0.09, 0.09)
      .setZoom(1.08)
      .setBackgroundColor('#07100c');

    this.dialog = new DialogBox(this);
    this.hud = new Hud(this);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.battleKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.debugKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F2);

    this.hint = this.add.text(480, 498, '', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: '#fff7dd',
      backgroundColor: '#0a1712e8', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(9995).setScrollFactor(0).setVisible(false);

    const areaTitle = this.add.text(480, 64, 'CAMPOS DE ALDER', {
      fontFamily: 'Georgia, serif', fontSize: '25px', color: '#fff2c7',
      stroke: '#17231b', strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9994).setAlpha(0);
    const areaSub = this.add.text(480, 95, 'Valle de Bruma', {
      fontFamily: 'Verdana, sans-serif', fontSize: '10px', color: '#dbe5d8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9994).setAlpha(0);
    this.tweens.add({ targets: [areaTitle, areaSub], alpha: 1, duration: 550, hold: 1500, yoyo: true, delay: 200 });

    this.lastPlayerPosition.copy(this.player.sprite);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.persistPosition());
  }

  update(_: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) this.debugGraphics.setVisible(!this.debugGraphics.visible);
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (this.dialog.active) this.dialog.advance();
      else this.tryInteract();
    }

    const moved = this.player.update(this.dialog.active);
    if (!this.dialog.active) this.updateInteractionHint(); else this.hint.setVisible(false);

    if (moved) {
      const current = this.player.sprite.getCenter();
      const dist = Phaser.Math.Distance.Between(current.x, current.y, this.lastPlayerPosition.x, this.lastPlayerPosition.y);
      this.movedSinceEncounter += dist;
      this.lastPlayerPosition.set(current.x, current.y);
      this.checkEncounter();
    }
    this.encounterCooldown = Math.max(0, this.encounterCooldown - delta);

    if (!this.dialog.active && Phaser.Input.Keyboard.JustDown(this.battleKey) && this.nearNpc('kael') && gameState.snapshot.questStage > 0) {
      this.startBattle(Phaser.Utils.Array.GetRandom(WORLD_ENCOUNTERS));
    }
  }

  private ensureSolidTexture(): void {
    if (this.textures.exists('solid')) return;
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0xffffff).fillRect(0, 0, 2, 2).generateTexture('solid', 2, 2);
    g.destroy();
  }

  private createCollisionBodies(): void {
    this.collisionGroup = this.physics.add.staticGroup();
    for (const r of WORLD_COLLISIONS) {
      const body = this.collisionGroup.create((r.x + r.w / 2) * WORLD_SCALE, (r.y + r.h / 2) * WORLD_SCALE, 'solid') as Phaser.Physics.Arcade.Image;
      body.setDisplaySize(Math.max(2, r.w * WORLD_SCALE), Math.max(2, r.h * WORLD_SCALE)).setVisible(false).refreshBody();
    }
    this.debugGraphics = this.add.graphics().setDepth(12000).setVisible(false);
    this.debugGraphics.lineStyle(1, 0xff5a5a, 0.74);
    for (const r of WORLD_COLLISIONS) this.debugGraphics.strokeRect(r.x * WORLD_SCALE, r.y * WORLD_SCALE, r.w * WORLD_SCALE, r.h * WORLD_SCALE);
  }

  private createNpcs(): void {
    for (const npc of NPCS) {
      const x = npc.x * WORLD_SCALE;
      const y = npc.y * WORLD_SCALE;
      this.add.ellipse(x, y + 22, 34, 12, 0x13291c, 0.24).setDepth(y + 22);
      const sprite = this.add.sprite(x, y, 'player-idle', npc.id === 'iria' ? 15 : 5)
        .setScale(2).setTint(npc.tint).setOrigin(0.5, 0.78).setDepth(y + 48);
      sprite.play(npc.id === 'iria' ? 'idle-down' : 'idle-left');

      const tag = this.add.text(x, y - 48, npc.name, {
        fontFamily: 'Verdana, sans-serif', fontSize: '10px', color: '#fff4d8',
        backgroundColor: '#0a1712cc', padding: { x: 7, y: 4 }
      }).setOrigin(0.5).setDepth(y + 51);
      tag.setAlpha(0.88);
      this.interactables.push({ id: npc.id, type: 'npc', x, y, label: npc.name });
    }
  }

  private createRunesAndEntrance(): void {
    for (const rune of RUNES) {
      const x = rune.x * WORLD_SCALE;
      const y = rune.y * WORLD_SCALE;
      const glow = this.add.circle(x, y, 13, 0xe8d57a, 0.12).setDepth(y + 18);
      const ring = this.add.circle(x, y, 8, 0x21392c, 0.9).setStrokeStyle(2, 0xe8d57a, 0.8).setDepth(y + 19);
      this.add.text(x, y - 1, rune.glyph, { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#fff0a8' }).setOrigin(0.5).setDepth(y + 20);
      this.tweens.add({ targets: [glow, ring], alpha: { from: 0.55, to: 1 }, scale: { from: 0.94, to: 1.08 }, duration: 1150, yoyo: true, repeat: -1 });
      this.interactables.push({ id: rune.id, type: 'rune', x, y, label: `Runa ${rune.id}` });
    }

    const ex = DUNGEON_ENTRANCE.x * WORLD_SCALE;
    const ey = DUNGEON_ENTRANCE.y * WORLD_SCALE;
    const marker = this.add.polygon(ex, ey - 28, [0, -8, 8, 0, 0, 8, -8, 0], 0xe7cf78, 0.95).setDepth(ey + 70);
    this.tweens.add({ targets: marker, y: ey - 35, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.interactables.push({ id: 'dungeon', type: 'entrance', x: ex, y: ey, label: 'Santuario antiguo' });
  }

  private nearestInteractable(maxDistance = 72): Interactable | undefined {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    return this.interactables
      .map(item => ({ item, d: Phaser.Math.Distance.Between(px, py, item.x, item.y) }))
      .filter(v => v.d <= maxDistance)
      .sort((a, b) => a.d - b.d)[0]?.item;
  }

  private updateInteractionHint(): void {
    const target = this.nearestInteractable();
    if (!target) { this.hint.setVisible(false); return; }
    this.hint.setText(`E  ·  ${target.label}`).setVisible(true);
  }

  private tryInteract(): void {
    const target = this.nearestInteractable();
    if (!target) return;
    if (target.type === 'npc') this.talkToNpc(target.id);
    else if (target.type === 'rune') this.activateRune(target.id);
    else this.enterDungeon();
  }

  private talkToNpc(id: string): void {
    const npc = NPCS.find(n => n.id === id);
    if (!npc) return;
    if (id === 'iria' && gameState.snapshot.questStage === 0) {
      this.dialog.show(`${npc.name} · ${npc.role}`, [...npc.dialog], () => {
        gameState.patch({ questStage: 1 });
        this.hud.refresh();
      });
      return;
    }
    const extra = id === 'kael' && gameState.snapshot.questStage > 0 ? ['Pulsa B junto a mí si quieres iniciar un duelo de práctica.'] : [];
    this.dialog.show(`${npc.name} · ${npc.role}`, [...npc.dialog, ...extra]);
  }

  private activateRune(id: string): void {
    if (gameState.snapshot.questStage === 0) {
      this.dialog.show('Marca antigua', ['La piedra está fría. Iria quizá sepa cómo despertarla.']);
      return;
    }
    if (gameState.hasFlag('runesSolved')) {
      this.dialog.show(`Runa ${id}`, ['La marca permanece encendida. El sello ya fue liberado.']);
      return;
    }
    const result = gameState.addRune(id);
    this.hud.refresh();
    if (result === 'wrong') this.dialog.show('La resonancia se rompe', ['La energía se dispersa y las marcas vuelven a apagarse.']);
    else if (result === 'complete') this.dialog.show('El valle responde', ['Las tres runas vibran al unísono.', 'Algo se ha abierto cerca de la casa del sur.']);
    else this.dialog.show(`Runa ${id}`, [`La marca ${id} empieza a emitir una luz tenue.`]);
  }

  private enterDungeon(): void {
    if (!gameState.hasFlag('runesSolved')) {
      this.dialog.show('Santuario antiguo', ['La entrada sigue sellada por tres marcas del valle.']);
      return;
    }
    this.persistPosition();
    this.scene.start('DungeonScene');
  }

  private nearNpc(id: string): boolean {
    const npc = NPCS.find(n => n.id === id);
    if (!npc) return false;
    return Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, npc.x * WORLD_SCALE, npc.y * WORLD_SCALE) < 90;
  }

  private checkEncounter(): void {
    if (this.encounterCooldown > 0 || this.movedSinceEncounter < 110) return;
    const px = this.player.sprite.x / WORLD_SCALE;
    const py = this.player.sprite.y / WORLD_SCALE;
    const inside = ENCOUNTER_ZONES.some(z => px >= z.x && px <= z.x + z.width && py >= z.y && py <= z.y + z.height);
    if (!inside) return;
    this.movedSinceEncounter = 0;
    if (Math.random() < 0.28) this.startBattle(Phaser.Utils.Array.GetRandom(WORLD_ENCOUNTERS));
  }

  private startBattle(enemyId: string): void {
    this.persistPosition();
    this.encounterCooldown = 1800;
    this.scene.start('BattleScene', { enemyId, returnScene: 'WorldScene' });
  }

  private persistPosition(): void {
    if (!this.player?.sprite) return;
    gameState.patch({ lastWorldPosition: { x: this.player.sprite.x / WORLD_SCALE, y: this.player.sprite.y / WORLD_SCALE } });
  }
}

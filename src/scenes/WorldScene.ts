import Phaser from 'phaser';
import { MAP_SIZE, WORLD_SCALE, WORLD_SIZE } from '../config/constants';
import { objectAssetKey } from '../data/objectAssets';
import { DUNGEON_ENTRANCE, ENCOUNTER_ZONES, NPCS, RUNES } from '../data/world';
import { WORLD_ENCOUNTERS } from '../data/creatures';
import { PlayerController } from '../entities/PlayerController';
import { gameState } from '../state/GameState';
import type { CollisionRect, WorldObjectData } from '../types/game';
import { DialogBox } from '../ui/DialogBox';
import { Hud } from '../ui/Hud';

interface Interactable {
  id: string;
  type: 'npc' | 'rune' | 'entrance';
  x: number;
  y: number;
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
  private collisionRects: CollisionRect[] = [];
  private movedSinceEncounter = 0;
  private lastPlayerPosition = new Phaser.Math.Vector2();
  private encounterCooldown = 0;

  constructor() { super('WorldScene'); }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
    this.add.image(0, 0, 'world-map').setOrigin(0).setScale(WORLD_SCALE).setDepth(0);

    this.ensureSolidTexture();
    this.createCollisionBodies();
    this.createForegroundObjects();
    this.createRunesAndEntrance();
    this.createNpcs();

    const pos = gameState.snapshot.lastWorldPosition;
    this.player = new PlayerController(this, pos.x * WORLD_SCALE, pos.y * WORLD_SCALE);
    this.physics.add.collider(this.player.sprite, this.collisionGroup);

    this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE).startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);
    this.cameras.main.setBackgroundColor('#07110d');

    this.dialog = new DialogBox(this);
    this.hud = new Hud(this);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.battleKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.debugKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F2);

    this.hint = this.add.text(0, 0, 'E · INTERACTUAR', {
      fontFamily: 'monospace', fontSize: '13px', color: '#fff5b0', backgroundColor: '#10261dcc', padding: { x: 7, y: 4 }
    }).setOrigin(0.5).setDepth(9990).setVisible(false);

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
    this.collisionRects = this.cache.json.get('world-collisions') as CollisionRect[];
    const group = this.physics.add.staticGroup();
    this.collisionGroup = group;
    for (const r of this.collisionRects) {
      const body = group.create((r.x + r.w / 2) * WORLD_SCALE, (r.y + r.h / 2) * WORLD_SCALE, 'solid') as Phaser.Physics.Arcade.Image;
      body.setDisplaySize(Math.max(2, r.w * WORLD_SCALE), Math.max(2, r.h * WORLD_SCALE)).setVisible(false).refreshBody();
    }
    this.debugGraphics = this.add.graphics().setDepth(12000).setVisible(false);
    this.debugGraphics.lineStyle(1, 0xff4d4d, 0.85);
    for (const r of this.collisionRects) this.debugGraphics.strokeRect(r.x * WORLD_SCALE, r.y * WORLD_SCALE, r.w * WORLD_SCALE, r.h * WORLD_SCALE);
  }

  private createForegroundObjects(): void {
    const objects = this.cache.json.get('world-objects') as WorldObjectData[];
    for (const o of objects) {
      if (o.kind === 'Objects_Shadows' || o.x > MAP_SIZE || o.y > MAP_SIZE || o.x + o.width < 0 || o.y + o.height < 0) continue;
      if (o.kind === 'Campfire') {
        const fire = this.add.sprite((o.x + o.width / 2) * WORLD_SCALE, (o.y + o.height / 2) * WORLD_SCALE, 'campfire')
          .setDisplaySize(o.width * WORLD_SCALE, o.height * WORLD_SCALE).setDepth(o.bottom * WORLD_SCALE);
        fire.play('campfire-loop');
        continue;
      }
      const key = objectAssetKey(o.asset);
      if (!this.textures.exists(key)) continue;
      this.add.image((o.x + o.width / 2) * WORLD_SCALE, (o.y + o.height / 2) * WORLD_SCALE, key)
        .setDisplaySize(o.width * WORLD_SCALE, o.height * WORLD_SCALE)
        .setDepth(o.bottom * WORLD_SCALE);
    }
  }

  private createNpcs(): void {
    for (const npc of NPCS) {
      const x = npc.x * WORLD_SCALE, y = npc.y * WORLD_SCALE;
      const shadow = this.add.ellipse(x, y + 22, 38, 15, 0x000000, 0.26).setDepth(y - 1);
      const sprite = this.add.sprite(x, y, 'player-idle', 0).setScale(2).setTint(npc.tint).setOrigin(0.5, 0.78).setDepth(y + 40);
      sprite.play('idle-down');
      this.add.text(x, y - 62, npc.name, { fontFamily: 'monospace', fontSize: '13px', color: '#fff9d9', backgroundColor: '#102018b8', padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(y + 41);
      shadow.setData('npc', npc.id);
      this.interactables.push({ id: npc.id, type: 'npc', x, y });
    }
  }

  private createRunesAndEntrance(): void {
    for (const rune of RUNES) {
      const x = rune.x * WORLD_SCALE, y = rune.y * WORLD_SCALE;
      const ring = this.add.circle(x, y, 17, 0x5cd89a, 0.18).setStrokeStyle(2, 0xdfffa4, 0.8).setDepth(y + 10);
      this.tweens.add({ targets: ring, alpha: { from: 0.35, to: 0.85 }, scale: { from: 0.88, to: 1.08 }, duration: 1100, yoyo: true, repeat: -1 });
      this.add.text(x, y - 2, rune.glyph, { fontFamily: 'serif', fontSize: '22px', color: '#efffb6' }).setOrigin(0.5).setDepth(y + 11);
      this.interactables.push({ id: rune.id, type: 'rune', x, y });
    }

    const ex = DUNGEON_ENTRANCE.x * WORLD_SCALE, ey = DUNGEON_ENTRANCE.y * WORLD_SCALE;
    this.add.image(ex, ey, 'sign').setScale(1.55).setDepth(ey + 4);
    const portal = this.add.ellipse(ex, ey + 28, 72, 30, 0x5f5bbd, 0.22).setStrokeStyle(2, 0xbcb7ff, 0.72).setDepth(ey + 5);
    this.tweens.add({ targets: portal, alpha: { from: 0.2, to: 0.6 }, duration: 900, yoyo: true, repeat: -1 });
    this.add.text(ex, ey - 48, 'SANTUARIO', { fontFamily: 'monospace', fontSize: '12px', color: '#ece9ff', backgroundColor: '#17142bcc', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(ey + 6);
    this.interactables.push({ id: 'dungeon', type: 'entrance', x: ex, y: ey });
  }

  private nearestInteractable(maxDistance = 78): Interactable | undefined {
    const px = this.player.sprite.x, py = this.player.sprite.y;
    return this.interactables
      .map(item => ({ item, d: Phaser.Math.Distance.Between(px, py, item.x, item.y) }))
      .filter(v => v.d <= maxDistance)
      .sort((a, b) => a.d - b.d)[0]?.item;
  }

  private updateInteractionHint(): void {
    const target = this.nearestInteractable();
    if (!target) { this.hint.setVisible(false); return; }
    this.hint.setPosition(this.player.sprite.x, this.player.sprite.y - 74).setVisible(true);
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
      this.dialog.show(npc.name, [...npc.dialog], () => {
        gameState.patch({ questStage: 1 });
        this.hud.refresh();
      });
      return;
    }
    const extra = id === 'kael' && gameState.snapshot.questStage > 0 ? ['Pulsa B junto a mí si quieres iniciar un duelo de práctica.'] : [];
    this.dialog.show(npc.name, [...npc.dialog, ...extra]);
  }

  private activateRune(id: string): void {
    if (gameState.snapshot.questStage === 0) {
      this.dialog.show('Runa sellada', ['Las marcas no reaccionan. Tal vez alguien en la aldea conozca el orden.']);
      return;
    }
    if (gameState.hasFlag('runesSolved')) {
      this.dialog.show(`Runa ${id}`, ['La runa permanece encendida. El sello del santuario está abierto.']);
      return;
    }
    const result = gameState.addRune(id);
    this.hud.refresh();
    if (result === 'wrong') this.dialog.show('Secuencia rota', ['La energía se dispersa. Las tres runas se han reiniciado.']);
    else if (result === 'complete') this.dialog.show('Sello liberado', ['SOL, RÍO y RAÍZ resuenan al unísono.', 'El santuario del sur ya puede abrirse.']);
    else this.dialog.show(`Runa ${id}`, [`La runa ${id} ha quedado activa.`]);
  }

  private enterDungeon(): void {
    if (!gameState.hasFlag('runesSolved')) {
      this.dialog.show('Santuario sellado', ['Tres runas mantienen cerrada la entrada.']);
      return;
    }
    this.persistPosition();
    this.scene.start('DungeonScene');
  }

  private nearNpc(id: string): boolean {
    const npc = this.interactables.find(i => i.type === 'npc' && i.id === id);
    return Boolean(npc && Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, npc.x, npc.y) < 90);
  }

  private checkEncounter(): void {
    if (gameState.snapshot.questStage === 0 || this.encounterCooldown > 0 || this.movedSinceEncounter < 100) return;
    const bx = this.player.sprite.x / WORLD_SCALE, by = this.player.sprite.y / WORLD_SCALE;
    const inZone = ENCOUNTER_ZONES.some(z => bx >= z.x && bx <= z.x + z.width && by >= z.y && by <= z.y + z.height);
    if (!inZone) return;
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

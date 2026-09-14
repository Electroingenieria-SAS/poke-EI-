import Phaser from 'phaser';
import { CREATURES } from '../data/creatures';
import { captureChance, damage, scaledHp } from '../systems/BattleEngine';
import { gameState } from '../state/GameState';
import type { CreatureDefinition } from '../types/game';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../config/constants';

interface BattleData { enemyId: string; returnScene: 'WorldScene' | 'DungeonScene'; boss?: boolean; }

export class BattleScene extends Phaser.Scene {
  private enemy!: CreatureDefinition;
  private ally!: CreatureDefinition;
  private enemyLevel = 1;
  private allyHp = 1;
  private enemyHp = 1;
  private allyStamina = 10;
  private enemyStamina = 10;
  private allyMaxHp = 1;
  private enemyMaxHp = 1;
  private busy = false;
  private returnScene: 'WorldScene' | 'DungeonScene' = 'WorldScene';
  private logText!: Phaser.GameObjects.Text;
  private allyInfo!: Phaser.GameObjects.Text;
  private enemyInfo!: Phaser.GameObjects.Text;
  private allySprite!: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  private enemySprite!: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  private buttons: Phaser.GameObjects.Text[] = [];

  constructor() { super('BattleScene'); }

  init(data: BattleData): void {
    this.enemy = CREATURES[data.enemyId] ?? CREATURES.mossling;
    this.returnScene = data.returnScene ?? 'WorldScene';
    const partyLead = gameState.snapshot.party[0]?.creatureId ?? 'mossling';
    this.ally = CREATURES[partyLead] ?? CREATURES.mossling;
    this.enemyLevel = Math.max(1, gameState.snapshot.playerLevel + (this.enemy.boss ? 2 : Phaser.Math.Between(-1, 1)));
    this.allyMaxHp = scaledHp(this.ally.maxHp, gameState.snapshot.playerLevel);
    this.enemyMaxHp = scaledHp(this.enemy.maxHp, this.enemyLevel);
    this.allyHp = this.allyMaxHp;
    this.enemyHp = this.enemyMaxHp;
    this.allyStamina = this.ally.maxStamina;
    this.enemyStamina = this.enemy.maxStamina;
    this.busy = false;
  }

  create(): void {
    this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, 0x10271e);
    this.add.circle(720, 192, 180, 0x254d39, 0.72);
    this.add.circle(230, 330, 170, 0x173c31, 0.9);
    this.add.rectangle(VIEW_WIDTH / 2, 460, VIEW_WIDTH - 50, 130, 0x07110d, 0.93).setStrokeStyle(3, 0xc6b76b);

    this.enemySprite = this.createCreatureSprite(this.enemy, 720, 205, 4.2, false);
    this.allySprite = this.createCreatureSprite(this.ally, 240, 326, 4.0, true);

    this.enemyInfo = this.add.text(52, 42, '', { fontFamily: 'monospace', fontSize: '18px', color: '#f4efd8', lineSpacing: 5 });
    this.allyInfo = this.add.text(52, 320, '', { fontFamily: 'monospace', fontSize: '18px', color: '#f4efd8', lineSpacing: 5 });
    this.logText = this.add.text(55, 418, `¡Un ${this.enemy.name} apareció!`, { fontFamily: 'monospace', fontSize: '17px', color: '#eef6e9', wordWrap: { width: 850 }, lineSpacing: 5 });

    const labels = ['1  Golpe', '2  Técnica', '3  Respirar', '4  Vínculo', '5  Huir'];
    labels.forEach((label, i) => {
      const x = 75 + (i % 3) * 290;
      const y = 480 + Math.floor(i / 3) * 42;
      const button = this.add.text(x, y, label, { fontFamily: 'monospace', fontSize: '17px', color: '#f8f6e9', backgroundColor: '#173629', padding: { x: 10, y: 7 } })
        .setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.playerAction(i + 1));
      this.buttons.push(button);
    });

    this.input.keyboard!.on('keydown-ONE', () => this.playerAction(1));
    this.input.keyboard!.on('keydown-TWO', () => this.playerAction(2));
    this.input.keyboard!.on('keydown-THREE', () => this.playerAction(3));
    this.input.keyboard!.on('keydown-FOUR', () => this.playerAction(4));
    this.input.keyboard!.on('keydown-FIVE', () => this.playerAction(5));
    this.refreshUi();
  }

  private createCreatureSprite(def: CreatureDefinition, x: number, y: number, scale: number, flip: boolean): Phaser.GameObjects.Image | Phaser.GameObjects.Sprite {
    if (def.animated) {
      const sprite = this.add.sprite(x, y, def.assetKey).setScale(scale).setFlipX(flip);
      sprite.play('campfire-loop');
      return sprite;
    }
    return this.add.image(x, y, def.assetKey).setScale(scale).setFlipX(flip);
  }

  private playerAction(action: number): void {
    if (this.busy) return;
    this.busy = true;
    if (action === 1) {
      const amount = damage(this.ally, this.enemy, gameState.snapshot.playerLevel, 1);
      this.enemyHp = Math.max(0, this.enemyHp - amount);
      this.flash(this.enemySprite);
      this.log(`Golpe causa ${amount} de daño.`);
    } else if (action === 2) {
      if (this.allyStamina < 3) { this.log('No tienes suficiente stamina.'); this.busy = false; return; }
      this.allyStamina -= 3;
      const amount = damage(this.ally, this.enemy, gameState.snapshot.playerLevel, 1.65);
      this.enemyHp = Math.max(0, this.enemyHp - amount);
      this.flash(this.enemySprite);
      this.log(`Técnica causa ${amount} de daño.`);
    } else if (action === 3) {
      this.allyStamina = Math.min(this.ally.maxStamina, this.allyStamina + 5);
      this.allyHp = Math.min(this.allyMaxHp, this.allyHp + 4);
      this.log('Respiras: recuperas stamina y un poco de vida.');
    } else if (action === 4) {
      if (this.enemy.boss) { this.log('El guardián no puede vincularse.'); this.busy = false; return; }
      const chance = captureChance(this.enemy, this.enemyHp, this.enemyMaxHp);
      if (Math.random() <= chance) {
        const added = gameState.addPartyMember({ creatureId: this.enemy.id, level: this.enemyLevel, xp: 0 });
        this.log(added ? `¡Vínculo exitoso! ${this.enemy.name} se une al equipo.` : `El vínculo funcionó, pero ya tienes a ${this.enemy.name}.`);
        this.time.delayedCall(1200, () => this.finishBattle(false));
        return;
      }
      this.log('El vínculo falló. La criatura se resiste.');
    } else if (action === 5) {
      if (this.enemy.boss) { this.log('No puedes huir del guardián.'); this.busy = false; return; }
      if (Math.random() < 0.72) { this.log('Escapaste del combate.'); this.time.delayedCall(700, () => this.returnToMap()); return; }
      this.log('No lograste escapar.');
    }

    this.refreshUi();
    if (this.enemyHp <= 0) { this.time.delayedCall(650, () => this.finishBattle(true)); return; }
    this.time.delayedCall(720, () => this.enemyTurn());
  }

  private enemyTurn(): void {
    if (this.enemyHp <= 0) return;
    let power = 1;
    if (this.enemyStamina >= 3 && Math.random() < 0.45) { this.enemyStamina -= 3; power = 1.45; }
    else if (this.enemyStamina < 2 && Math.random() < 0.35) {
      this.enemyStamina = Math.min(this.enemy.maxStamina, this.enemyStamina + 4);
      this.log(`${this.enemy.name} recupera stamina.`);
      this.refreshUi();
      this.busy = false;
      return;
    }
    const amount = damage(this.enemy, this.ally, this.enemyLevel, power);
    this.allyHp = Math.max(0, this.allyHp - amount);
    this.flash(this.allySprite);
    this.log(`${this.enemy.name} ataca y causa ${amount} de daño.`);
    this.refreshUi();
    if (this.allyHp <= 0) {
      this.log('Tu criatura cayó. Regresas a la aldea.');
      this.time.delayedCall(1300, () => this.scene.start('WorldScene'));
      return;
    }
    this.busy = false;
  }

  private finishBattle(defeated: boolean): void {
    if (defeated) {
      const reward = this.enemy.xp + this.enemyLevel * 2;
      const result = gameState.grantXp(reward);
      if (this.enemy.boss) {
        gameState.setFlag('bossDefeated');
        gameState.patch({ questStage: 3 });
        this.log(`El Guardián cae. +${reward} XP. El santuario vuelve a estar en calma.`);
        this.time.delayedCall(1500, () => this.scene.start('WorldScene'));
        return;
      }
      this.log(`${this.enemy.name} fue derrotado. +${reward} XP${result.leveled ? ` · ¡Nivel ${result.level}!` : ''}`);
    }
    this.time.delayedCall(1200, () => this.returnToMap());
  }

  private returnToMap(): void { this.scene.start(this.returnScene); }

  private refreshUi(): void {
    this.enemyInfo.setText([`${this.enemy.name}  Nv.${this.enemyLevel}`, `HP ${this.enemyHp}/${this.enemyMaxHp}   STA ${this.enemyStamina}/${this.enemy.maxStamina}`]);
    this.allyInfo.setText([`${this.ally.name}  Nv.${gameState.snapshot.playerLevel}`, `HP ${this.allyHp}/${this.allyMaxHp}   STA ${this.allyStamina}/${this.ally.maxStamina}`]);
    this.buttons[3]?.setAlpha(this.enemy.boss ? 0.45 : 1);
    this.buttons[4]?.setAlpha(this.enemy.boss ? 0.45 : 1);
  }

  private log(message: string): void { this.logText.setText(message); }

  private flash(target: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
    this.tweens.add({ targets: target, alpha: 0.25, x: target.x + Phaser.Math.Between(-10, 10), duration: 90, yoyo: true, repeat: 2 });
  }
}

import Phaser from 'phaser';
import { VIEW_HEIGHT, VIEW_WIDTH } from '../config/constants';

export class DialogBox {
  private container: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;
  private lines: string[] = [];
  private index = 0;
  private onComplete?: () => void;

  constructor(private scene: Phaser.Scene) {
    const panel = scene.add.graphics();
    panel.fillStyle(0x08140f, 0.96).fillRoundedRect(36, VIEW_HEIGHT - 154, VIEW_WIDTH - 72, 122, 14);
    panel.lineStyle(1, 0xe4cf8a, 0.5).strokeRoundedRect(36.5, VIEW_HEIGHT - 153.5, VIEW_WIDTH - 73, 121, 14);
    panel.fillStyle(0xe4cf8a, 0.85).fillRoundedRect(36, VIEW_HEIGHT - 154, 7, 122, { tl: 14, bl: 14, tr: 0, br: 0 });

    this.nameText = scene.add.text(60, VIEW_HEIGHT - 137, '', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: '#e8cf87', fontStyle: 'bold'
    });
    this.bodyText = scene.add.text(60, VIEW_HEIGHT - 109, '', {
      fontFamily: 'Verdana, sans-serif', fontSize: '16px', color: '#fffaf0',
      wordWrap: { width: VIEW_WIDTH - 132 }, lineSpacing: 5
    });
    this.hintText = scene.add.text(VIEW_WIDTH - 60, VIEW_HEIGHT - 49, 'E  CONTINUAR', {
      fontFamily: 'Verdana, sans-serif', fontSize: '10px', color: '#bcd0bf'
    }).setOrigin(1, 1);

    this.container = scene.add.container(0, 0, [panel, this.nameText, this.bodyText, this.hintText])
      .setDepth(10000)
      .setScrollFactor(0)
      .setVisible(false);
  }

  get active(): boolean { return this.container.visible; }

  show(name: string, lines: string[], onComplete?: () => void): void {
    this.lines = lines;
    this.index = 0;
    this.onComplete = onComplete;
    this.nameText.setText(name.toUpperCase());
    this.bodyText.setText(this.lines[0] ?? '');
    this.container.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 140 });
  }

  advance(): void {
    if (!this.active) return;
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.hide();
      this.onComplete?.();
      return;
    }
    this.bodyText.setText(this.lines[this.index]);
  }

  hide(): void { this.container.setVisible(false); }
}

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
    const bg = scene.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT - 88, VIEW_WIDTH - 48, 142, 0x081510, 0.94)
      .setStrokeStyle(3, 0xd8c37d);
    this.nameText = scene.add.text(48, VIEW_HEIGHT - 148, '', { fontFamily: 'monospace', fontSize: '20px', color: '#f8df8f', fontStyle: 'bold' });
    this.bodyText = scene.add.text(48, VIEW_HEIGHT - 116, '', { fontFamily: 'monospace', fontSize: '18px', color: '#f6f4e8', wordWrap: { width: VIEW_WIDTH - 96 }, lineSpacing: 6 });
    this.hintText = scene.add.text(VIEW_WIDTH - 58, VIEW_HEIGHT - 40, 'E ▶', { fontFamily: 'monospace', fontSize: '16px', color: '#b7d8c6' }).setOrigin(1, 1);
    this.container = scene.add.container(0, 0, [bg, this.nameText, this.bodyText, this.hintText]).setDepth(10000).setScrollFactor(0).setVisible(false);
  }

  get active(): boolean { return this.container.visible; }

  show(name: string, lines: string[], onComplete?: () => void): void {
    this.lines = lines;
    this.index = 0;
    this.onComplete = onComplete;
    this.nameText.setText(name);
    this.bodyText.setText(this.lines[0] ?? '');
    this.container.setVisible(true);
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

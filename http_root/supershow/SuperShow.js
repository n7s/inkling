// =============================================================================
// SuperShow.js - Main orchestrator for the font animation system
// =============================================================================

import { FontLoader } from '../core/FontLoader.js';
import { DragAndDrop } from '../shared/DragAndDrop.js';
import { WordPacker } from './WordPacker.js';
import { WordCreator } from './WordCreator.js';
import { AnimationController } from './AnimationController.js';
import { SuperUI } from './SuperUI.js';

class SuperShow {
  constructor() {
    // Core state
    this.fonts = [];
    this.isAnimating = false;

    // DOM elements
    this.container = document.querySelector('.display-container');
    this.wordStream = document.getElementById('word-stream');

    // Initialize components
    this.wordCreator = new WordCreator();
    this.wordPacker = new WordPacker(this.wordStream);
    this.animationController = new AnimationController(this.wordStream);
    this.superUI = new SuperUI({
      onSpeedChange: this.handleSpeedChange.bind(this),
      onAngleChange: this.handleAngleChange.bind(this),
      onColorChange: this.handleColorChange.bind(this)
    });

    // Font handling
    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: this.handleFontDrop.bind(this)
    });

    // Initialize system
    this.wordCreator.loadWordList();
  }

  async handleFontDrop(buffer, filename) {
    try {
      // Load the font
      const fontData = await this.fontLoader.loadFont(buffer, filename);

      // Add to available fonts
      this.fonts.push(fontData);
      this.wordCreator.addFont(fontData);

      // Start animation if this is the first font
      if (this.fonts.length === 1) {
        this.start();
      }
    } catch (error) {
      console.error('Error loading font:', error);
      alert('Error loading font file');
    }
  }

  handleFontLoaded(fontData) {
    console.log('Font loaded:', fontData.fontFamily);
  }

  handleSpeedChange(speed) {
    this.animationController.setSpeed(speed);
  }

  handleAngleChange(angle) {
    this.animationController.setAngle(angle);
  }

  handleColorChange(foreground, background) {
    this.wordCreator.setColors(foreground, background);
    this.container.style.backgroundColor = background;
  }

  start() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Initialize word packing
    this.wordPacker.initialize();

    // Start animation
    this.animationController.start({
      onFrame: this.updateFrame.bind(this)
    });
  }

  updateFrame() {
    if (!this.isAnimating) return;

    // Let packer manage words and gaps
    this.wordPacker.update();

    // Create new words as needed
    while (this.wordPacker.needsWords()) {
      const word = this.wordCreator.createWord();
      this.wordPacker.addWord(word);
    }
  }

  stop() {
    this.isAnimating = false;
    this.animationController.stop();
    this.wordPacker.clear();
    this.wordStream.innerHTML = '';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SuperShow();
});

export { SuperShow };
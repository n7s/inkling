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

    // Initialize UI with callbacks
    this.superUI = new SuperUI({
      onSpeedChange: (speed) => this.animationController.setSpeed(speed),
      onAngleChange: (angle) => this.animationController.setAngle(angle),
      onColorChange: (fg, bg) => this.handleColorChange(fg, bg)
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

    // Debug logging
    console.log('SuperShow initialized');
  }

  async handleFontDrop(buffer, filename) {
    try {
      console.log('Font dropped:', filename);

      // Load the font
      const fontData = await this.fontLoader.loadFont(buffer, filename);
      console.log('Font loaded:', fontData.fontFamily);

      // Add to available fonts
      this.fonts.push(fontData);
      this.wordCreator.addFont(fontData);

      // Start animation if this is the first font
      if (this.fonts.length === 1) {
        console.log('Starting animation');
        this.start();
      }
    } catch (error) {
      console.error('Error loading font:', error);
      alert('Error loading font file');
    }
  }

  handleFontLoaded(fontData) {
    console.log('Font ready:', fontData.fontFamily);
  }

  handleColorChange(foreground, background) {
    // Only apply colors if we have fonts loaded
    if (this.fonts.length > 0) {
      this.wordCreator.setColors(foreground, background);
      if (this.container) {
        this.container.style.backgroundColor = background;
      }
    }
  }

  start() {
    if (this.isAnimating) return;

    console.log('Starting animation system');
    this.isAnimating = true;

    // Initialize packing system
    this.wordPacker.initialize();

    // Start animation with frame callback
    this.animationController.start({
      onFrame: () => {
        // Update packing system
        this.wordPacker.update();

        // Create new words as needed
        while (this.wordPacker.needsWords()) {
          const word = this.wordCreator.createWord();
          if (word) {
            this.wordPacker.addWord(word);
          }
        }
      }
    });
  }

  stop() {
    console.log('Stopping animation system');
    this.isAnimating = false;
    this.animationController.stop();
    this.wordPacker.clear();
    if (this.wordStream) {
      this.wordStream.innerHTML = '';
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SuperShow();
});

export { SuperShow };
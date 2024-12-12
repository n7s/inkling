// =============================================================================
// SuperShow.js - Font animation system with tight packing
// =============================================================================

import { FontLoader } from '../core/FontLoader.js';
import { DragAndDrop } from '../shared/DragAndDrop.js';
import { UIControls } from '../shared/UIControls.js';
import { WordCreator } from './WordCreator.js';
import { WordPacker } from './WordPacker.js';
import { SuperUI } from './SuperUI.js';
import { WordMeasurement } from './WordMeasurement.js';
import { AnimationTimingController } from './AnimationTimingController.js';
import { WordCloudController } from './WordCloudController.js';

class SuperShow {
  constructor() {
    this.timingController = new AnimationTimingController();
    this.initializeState();
    this.initializeConfiguration();
    this.initializeViewport();
    // Add WordPacker initialization
    this.wordPacker = new WordPacker(
      document.getElementById('word-stream'),
      this.timingController
    );
    this.initializeComponents();
    this.initializeEventListeners();
    this.loadWordList();
  }


  initializeState() {
    this.fonts = [];
    this.words = [];
    this.isAnimating = false;
    this.animationFrame = null;
    this.wordBubbles = [];
    this.initialWordsPlaced = false;
    this.mode = 'stream';
    this.animatingWords = new Map(); // Add for animation tracking
    this.lastRenderTime = 0;
  }

  initializeConfiguration() {
    const settings = this.timingController.getSettings();
    this.bubblePadding = settings.minWordSpacing || 5;
    this.wordCreator = new WordCreator();
    this.wordMeasurement = new WordMeasurement();
  }

  initializeViewport() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.gridCells = 20;
    this.cellHeight = this.viewportHeight / this.gridCells;
    this.initialWordsPlaced = false;
    this.wordBubbles = [];
  }

  async initializeComponents() {
    this.container = document.querySelector('.display-container');
    this.wordStream = document.getElementById('word-stream');

    this.cloudController = new WordCloudController(this.container, {
      fonts: this.fonts,
      words: this.words
    });

    this.ui = new SuperUI({
      onSpeedChange: (speed) => {
        if (this.mode === 'cloud' && this.cloudController) {
          this.cloudController.setSpeed(speed);
        }
      },
      onAngleChange: (angle) => {
        if (this.mode === 'cloud' && this.cloudController) {
          this.cloudController.options.rotationRange = [-angle, angle];
        }
      },
      onColorChange: (fg, bg) => {
        if (this.mode === 'cloud') {
          this.cloudController?.setColors(fg, bg);
        } else {
          this.setColors(fg, bg);
        }
      },
      onReset: () => this.reset(),
      onToggleFontInfo: (visible) => this.toggleFontInfo(visible)
    });

    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: this.handleFontDrop.bind(this)
    });
  }

  async createWord() {
    if (!this.wordCreator || !this.wordCreator.fonts.length) {
      return null;
    }

    const element = this.wordCreator.createWord();
    if (!element) return null;

    // Get measurements first
    const metrics = await this.wordMeasurement.measureWord(element);
    if (!metrics) return null;

    // Set initial styles before packing
    element.style.position = 'absolute';
    element.classList.add('stream-word');
    element.style.setProperty('--word-width', `${metrics.width}px`);
    element.style.setProperty('--start-x', '0px');

    // Try to add word using WordPacker
    const success = await this.wordPacker.addWord(element);
    if (!success) {
      element.remove();
      return null;
    }

    const bubble = {
      element: element,
      startTime: performance.now()
    };

    this.wordBubbles.push(bubble);

    element.addEventListener('animationend', () => {
      const index = this.wordBubbles.indexOf(bubble);
      if (index !== -1) {
        this.wordBubbles.splice(index, 1);
      }
      element.remove();
    });

    return element;
  }

  update(timestamp) {
    if (!this.isAnimating) return;

    if (this.timingController.shouldCreateWord(timestamp)) {
        this.createWord().then(word => {
            if (word) this.wordStream.appendChild(word);
        });
    }

    this.animationFrame = requestAnimationFrame(this.update.bind(this));
}

  start() {
    if (this.isAnimating) return;
    if (!this.wordCreator || !this.wordCreator.words.length) {
      console.error('Cannot start: no words available');
      return;
    }
    this.isAnimating = true;
    this.lastRenderTime = performance.now();
    if (this.mode === 'cloud') {
      this.cloudController.start();
    } else {
      this.update(performance.now());
    }
  }

  stop() {
    this.isAnimating = false;
    if (this.mode === 'cloud') {
      this.cloudController?.stop();
    } else {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      if (this.wordStream) {
        this.wordStream.innerHTML = '';
      }
      this.wordBubbles = [];
    }
  }

  reset() {
    this.stop();
    this.start();
  }

  handleFontLoaded(fontData) {
    this.fonts.push(fontData);
    this.wordCreator.addFont(fontData);
    if (this.cloudController) {
      this.cloudController.options.fonts = this.fonts;
    }
    if (!this.isAnimating && this.fonts.length === 1) {
      this.start();
    }
  }

  async handleFontDrop(buffer, filename) {
    try {
      const fontData = await this.fontLoader.loadFont(buffer, filename);
      this.handleFontLoaded(fontData);
    } catch (error) {
      console.error('Error loading font:', error);
      alert('Error loading font file');
    }
  }

  setColors(foreground, background) {
    if (this.container) {
      this.container.style.backgroundColor = background;
    }
    const words = this.wordStream.querySelectorAll('.stream-word');
    words.forEach(word => {
      word.style.color = foreground;
    });
  }

  toggleFontInfo(visible) {
    const fontInfo = document.getElementById('font-info');
    if (fontInfo) {
      fontInfo.style.display = visible ? 'block' : 'none';
    }
  }

  initializeEventListeners() {
    window.addEventListener('resize', () => {
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
      this.cellHeight = this.viewportHeight / this.gridCells;
      this.timingController.updateViewport(this.viewportWidth);
    });
  }

  async loadWordList() {
    try {
      const response = await fetch('/word_lists/euro_words.txt');
      const text = await response.text();
      this.words = text.split('\n').filter(word => word.trim());
      if (this.words.length > 0) {
        this.wordCreator.words = this.words;
        console.log(`Loaded ${this.words.length} words`);
      } else {
        console.warn('Word list was empty, using default words');
        this.words = ['Typography', 'Design', 'Letters', 'Words'];
        this.wordCreator.words = this.words;
      }
    } catch (error) {
      console.error('Error loading word list:', error);
      this.words = ['Typography', 'Design', 'Letters', 'Words'];
      this.wordCreator.words = this.words;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SuperShow();
});

export { SuperShow };
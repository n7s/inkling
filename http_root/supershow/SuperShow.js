// =============================================================================
// SuperShow.js - Font animation system with tight packing
// =============================================================================

import { FontLoader } from '../core/FontLoader.js';
import { DragAndDrop } from '../shared/DragAndDrop.js';
import { UIControls } from '../shared/UIControls.js';
import { AnimationController } from './AnimationController.js';
import { WordCreator } from './WordCreator.js';
import { WordPacker } from './WordPacker.js';
import { SuperUI } from './SuperUI.js';

class SuperShow {
  // =========================================================================
  // Initialization
  // =========================================================================

  constructor() {
    this.initializeState();
    this.initializeConfiguration();
    this.initializeViewport();
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
    this.currentLine = { y: 0, height: 0, xOffset: 0 };
  }

  initializeConfiguration() {
    this.minFontSize = 1.5;
    this.maxFontSize = 10;
    this.wordInterval = 50;
    this.lastWordTime = 0;
    this.margin = 5;
    this.bubblePadding = 5;
  }

  initializeViewport() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.gridCells = 20;
    this.cellHeight = this.viewportHeight / this.gridCells;
  }

  async initializeComponents() {
    // DOM elements
    this.container = document.querySelector('.display-container');
    this.wordStream = document.getElementById('word-stream');

    // Canvas setup
    this.measuringCanvas = document.createElement('canvas');
    this.ctx = this.measuringCanvas.getContext('2d');

    // Initialize animation controller
    this.animationController = new AnimationController(this.wordStream);

    // Initialize UI
    this.ui = new SuperUI({
      onSpeedChange: (speed) => {
        const duration = 30 - ((speed - 1) / (1000 - 1)) * (30 - 1);
        document.documentElement.style.setProperty('--animation-duration', `${duration}s`);
      },
      onAngleChange: (angle) => this.animationController.setAngle(angle),
      onColorChange: (fg, bg) => this.setColors(fg, bg)
    });

    // Initialize controls
    this.uiControls = new UIControls();

    // Initialize word creator
    this.wordCreator = new WordCreator();
    await this.wordCreator.loadWordList(); // Ensure words are loaded before continuing

    // Initialize font handling
    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: this.handleFontDrop.bind(this)
    });
  }

  initializeEventListeners() {
    window.addEventListener('resize', () => {
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
      this.cellHeight = this.viewportHeight / this.gridCells;
    });
  }

  // =========================================================================
  // Word List Management
  // =========================================================================

  async loadWordList() {
    try {
      const response = await fetch('../word_lists/euro_words.txt');
      const text = await response.text();
      this.words = text.split('\n').filter(word => word.trim());
    } catch (error) {
      console.error('Error loading word list:', error);
      this.words = ['Typography', 'Design', 'Letters', 'Words'];
    }
  }

  // =========================================================================
  // Word Creation and Measurement
  // =========================================================================

  measureWord(text, fontFamily, fontSize) {
    this.ctx.font = `${fontSize}vh ${fontFamily}`;
    const metrics = this.ctx.measureText(text);
    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    return {
      width: metrics.width,
      height: height,
      baseline: metrics.actualBoundingBoxAscent
    };
  }

  transformCase(word) {
    const random = Math.random();
    if (random < 0.1) return word.toUpperCase();
    if (random < 0.3) return word.charAt(0).toUpperCase() + word.slice(1);
    return word;
  }

  createWord() {
    if (!this.wordCreator || !this.wordCreator.fonts.length) {
      console.log('No fonts available for word creation');
      return null;
    }

    const element = this.wordCreator.createWord();
    if (element) {
      const metrics = this.measureWord(element.textContent, element.style.fontFamily, parseFloat(element.style.fontSize));
      const position = this.findAvailablePosition(metrics);

      if (position) {
        element.style.setProperty('--y', `${position.y}vh`);
        const bubble = this.createBubble(element, position, metrics);
        this.setupBubbleCleanup(element, bubble);

        console.log('Word created with settings:', {
          text: element.textContent,
          fontFamily: element.style.fontFamily,
          variationSettings: element.style.fontVariationSettings,
          position: position
        });

        return element;
      }
    }

    return null;
  }

  calculateFontSize() {
    const sizeRand = Math.random();
    if (sizeRand < 0.4) {
      return this.minFontSize + (this.maxFontSize - this.minFontSize) * 0.2;
    } else if (sizeRand < 0.7) {
      return this.minFontSize + (this.maxFontSize - this.minFontSize) * 0.4;
    } else if (sizeRand < 0.9) {
      return this.minFontSize + (this.maxFontSize - this.minFontSize) * 0.6;
    }
    return this.maxFontSize;
  }

  // =========================================================================
  // Position Management
  // =========================================================================

  findNextPosition(wordWidth, wordHeight, baseline) {
    const containerHeight = this.wordStream.offsetHeight;
    const containerWidth = this.wordStream.offsetWidth;

    if (this.currentLine.xOffset + wordWidth + this.margin > containerWidth) {
      this.currentLine.y += this.currentLine.height + this.margin;
      this.currentLine.xOffset = 0;
      this.currentLine.height = 0;

      if (this.currentLine.y > containerHeight) {
        this.currentLine.y = 0;
      }
    }

    const position = {
      x: this.currentLine.xOffset,
      y: this.currentLine.y + baseline
    };

    this.currentLine.xOffset += wordWidth + this.margin;
    this.currentLine.height = Math.max(this.currentLine.height, wordHeight);

    return position;
  }

  findAvailablePosition(metrics) {
    const bubbleWidth = metrics.width + (this.bubblePadding * 2);
    const bubbleHeight = metrics.height + (this.bubblePadding * 2);
    const bubbleHeightVh = (bubbleHeight / this.viewportHeight) * 100;

    // Extend vertical range to cover rotated corners
    const minY = -100; // Allow placement 100vh above viewport
    const maxY = 200;  // Allow placement 200vh below viewport
    const range = maxY - minY;

    for (let attempts = 0; attempts < 50; attempts++) {
      // Generate position across extended range
      const y = minY + (Math.random() * range);

      const hasCollision = this.checkCollisions(y, bubbleHeightVh);
      if (!hasCollision) {
        return { x: this.viewportWidth, y };
      }
    }

    // Fallback position also uses extended range
    return { x: this.viewportWidth, y: minY + (Math.random() * range) };
  }

  checkCollisions(y, bubbleHeightVh) {
    return this.wordBubbles.some(bubble => {
      const timeDiff = performance.now() - bubble.startTime;
      if (timeDiff > 2000) return false;
      return Math.abs(y - bubble.y) < bubbleHeightVh;
    });
  }

  checkBubbleCollision(bubble1, bubble2) {
    const margin = this.bubblePadding * 2;
    return !(
      bubble1.x + bubble1.width < bubble2.x - margin ||
      bubble1.x - margin > bubble2.x + bubble2.width ||
      bubble1.y + bubble1.height < bubble2.y - margin ||
      bubble1.y - margin > bubble2.y + bubble2.height
    );
  }

  // =========================================================================
  // Animation and Updates
  // =========================================================================

  update(timestamp) {
    if (!this.isAnimating) return;

    this.updateBubblePositions();
    this.createNewWordsIfNeeded(timestamp);
    this.animationFrame = requestAnimationFrame(this.update.bind(this));
  }

  updateBubblePositions() {
    this.wordBubbles.forEach(bubble => {
      const transform = new WebKitCSSMatrix(window.getComputedStyle(bubble.element).transform);
      bubble.x = transform.e;
    });
  }

  createNewWordsIfNeeded(timestamp) {
    if (timestamp - this.lastWordTime > this.wordInterval) {
      const word = this.createWord();
      if (word) {
        this.wordStream.appendChild(word);
        this.lastWordTime = timestamp;
      }
    }
  }

  // =========================================================================
  // Font Management
  // =========================================================================

  async handleFontDrop(buffer, filename) {
    try {
      const fontData = await this.fontLoader.loadFont(buffer, filename);
      console.log('Font loaded from drop:', fontData);
      this.handleFontLoaded(fontData);
    } catch (error) {
      console.error('Error loading font:', error);
      alert('Error loading font file');
    }
  }

  handleFontLoaded(fontData) {
    console.log('Font loaded in SuperShow, data:', {
      fontFamily: fontData.fontFamily,
      hasInfo: !!fontData.fontInfo,
      hasAxes: !!fontData.fontInfo?.axes,
      axes: fontData.fontInfo?.axes
    });

    // Add font to WordCreator
    this.wordCreator.addFont(fontData);

    // Start animation if not already running
    if (!this.isAnimating) {
      this.start();
    }
  }

  // =========================================================================
  // Control Methods
  // =========================================================================

  start() {
    if (this.isAnimating) return;
    if (!this.wordCreator || !this.wordCreator.words.length) {
      console.error('Cannot start: no words available');
      return;
    }
    this.isAnimating = true;
    this.lastWordTime = 0;
    this.currentLine = { y: 0, height: 0, xOffset: 0 };
    this.update();
  }

  stop() {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.wordStream) {
      this.wordStream.innerHTML = '';
    }
    this.currentLine = { y: 0, height: 0, xOffset: 0 };
  }

  setColors(foreground, background) {
    this.foregroundColor = foreground;
    if (this.container) {
      this.container.style.backgroundColor = background;
    }
    const words = this.wordStream.querySelectorAll('.stream-word');
    words.forEach(word => {
      word.style.color = foreground;
    });
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  createBubble(element, position, metrics) {
    const bubble = {
      x: position.x,
      y: position.y,
      width: metrics.width + (this.bubblePadding * 2),
      height: metrics.height + (this.bubblePadding * 2),
      element: element,
      startTime: performance.now()
    };
    this.wordBubbles.push(bubble);
    return bubble;
  }

  setupBubbleCleanup(element, bubble) {
    element.addEventListener('animationend', () => {
      const index = this.wordBubbles.findIndex(b => b.element === element);
      if (index !== -1) {
        this.wordBubbles.splice(index, 1);
      }
      element.remove();
    }, { once: true });
  }

  cleanupOccupiedSpaces() {
    const now = Date.now();
    this.wordBubbles = this.wordBubbles.filter(bubble =>
      performance.now() - bubble.startTime < 15000
    );
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SuperShow();
});

export { SuperShow };
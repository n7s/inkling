// =============================================================================
// SuperShow.js - Font animation system with tight packing
// =============================================================================

import { FontLoader } from '../core/FontLoader.js';
import { DragAndDrop } from '../shared/DragAndDrop.js';
import { UIControls } from '../shared/UIControls.js';
import { WordCreator } from './WordCreator.js';
import { SuperUI } from './SuperUI.js';
import { WordMeasurement } from './WordMeasurement.js';
import { AnimationTimingController } from './AnimationTimingController.js';

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
    // Add WordMeasurement instance
    this.wordMeasurement = new WordMeasurement();
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
    // Keep all existing initialization code
    this.container = document.querySelector('.display-container');
    this.wordStream = document.getElementById('word-stream');

    // Replace AnimationController with TimingController
    this.timingController = new AnimationTimingController();

    // Update UI initialization to use timing controller
    this.ui = new SuperUI({
      onSpeedChange: (speed) => {
        this.timingController.setSpeed(speed);
      },
      onAngleChange: (angle) => {
        if (this.wordStream) {
          this.wordStream.style.transform = `rotate(${angle}deg)`;
        }
      },
      onColorChange: (fg, bg) => this.setColors(fg, bg)
    });

    // Keep all other component initialization
    this.uiControls = new UIControls();
    this.wordCreator = new WordCreator();
    await this.wordCreator.loadWordList();

    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: this.handleFontDrop.bind(this)
    });
  }

  // Modify only the timing-related part of the update method
  update(timestamp) {
    if (!this.isAnimating) return;

    if (this.timingController.shouldCreateWord(timestamp)) {
        // Create word and measure it before adding to DOM
        this.createWord().then(word => {
            if (word) {
                // Force a layout recalculation before animation starts
                word.style.display = 'none';
                this.wordStream.appendChild(word);

                // Force browser to process the addition
                word.offsetHeight;

                // Now make it visible and start animation
                word.style.display = '';
            }
        });
    }

    this.updateBubblePositions();
    this.animationFrame = requestAnimationFrame(this.update.bind(this));
}

  initializeEventListeners() {
    window.addEventListener('resize', () => {
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
      this.cellHeight = this.viewportHeight / this.gridCells;
      this.timingController.updateViewport(this.viewportWidth);
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

  async measureWord(element) {
    try {
        return await this.wordMeasurement.measureWord(element);
    } catch (error) {
        console.error('Error measuring word:', error);
        // Fallback measurements if needed
        return {
            width: element.offsetWidth,
            height: element.offsetHeight / window.innerHeight * 100,
            heightVh: (element.offsetHeight / window.innerHeight * 100),
            widthVh: (element.offsetWidth / window.innerHeight * 100),
            boundingBox: {
                top: 0,
                right: element.offsetWidth,
                bottom: element.offsetHeight,
                left: 0
            },
            baseline: 0
        };
    }
}

async createWord() {
  if (!this.wordCreator || !this.wordCreator.fonts.length) {
      console.log('No fonts available for word creation');
      return null;
  }

  const element = this.wordCreator.createWord();
  if (element) {
      const metrics = await this.measureWord(element);
      const position = this.findAvailablePosition(metrics);

      if (position) {
          element.style.setProperty('--y', `${position.y}vh`);
          const bubble = this.createBubble(element, position, metrics);
          this.setupBubbleCleanup(element, bubble);
          return element;
      }
  }

  return null;
}

  createNewWordsIfNeeded(timestamp) {
    if (timestamp - this.lastWordTime >= this.wordInterval) {
        const word = this.createWord();
        if (word) {
            this.wordStream.appendChild(word);
            this.lastWordTime = timestamp;
        }
    }
}

  // =========================================================================
  // Position Management
  // =========================================================================

  findAvailablePosition(metrics) {
    const bubbleWidth = metrics.width + (this.bubblePadding * 2);
    const bubbleHeight = metrics.height + (this.bubblePadding * 2);
    const bubbleHeightVh = (bubbleHeight / this.viewportHeight) * 100;

    const minY = -100;
    const maxY = 200;
    const range = maxY - minY;

    for (let attempts = 0; attempts < 50; attempts++) {
      const y = minY + (Math.random() * range);
      const hasCollision = this.checkCollisions(y, bubbleHeightVh);
      if (!hasCollision) {
        return { x: this.viewportWidth, y };
      }
    }

    return { x: this.viewportWidth, y: minY + (Math.random() * range) };
  }

  checkCollisions(y, bubbleHeightVh) {
    return this.wordBubbles.some(bubble => {
      const timeDiff = performance.now() - bubble.startTime;
      if (timeDiff > 2000) return false;
      return Math.abs(y - bubble.y) < bubbleHeightVh;
    });
  }

  // =========================================================================
  // Animation and Updates
  // =========================================================================

  update(timestamp) {
    if (!this.isAnimating) return;

    if (timestamp - this.lastWordTime >= this.wordInterval) {
        this.createWord().then(word => {
            if (word) {
                this.wordStream.appendChild(word);
                this.lastWordTime = timestamp;
            }
        });
    }

    this.updateBubblePositions();
    this.animationFrame = requestAnimationFrame(this.update.bind(this));
}

  updateBubblePositions() {
    this.wordBubbles.forEach(bubble => {
      const transform = new WebKitCSSMatrix(window.getComputedStyle(bubble.element).transform);
      bubble.x = transform.e;
    });
  }

  // =========================================================================
  // Font Management
  // =========================================================================

  async handleFontDrop(buffer, filename) {
    try {
      const fontData = await this.fontLoader.loadFont(buffer, filename);
      this.handleFontLoaded(fontData);
    } catch (error) {
      console.error('Error loading font:', error);
      alert('Error loading font file');
    }
  }

  handleFontLoaded(fontData) {
    this.wordCreator.addFont(fontData);
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
    this.update(performance.now());
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
    this.wordBubbles = [];
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
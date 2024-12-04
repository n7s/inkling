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
    this.timingController = new AnimationTimingController();
    this.wordMeasurement = new WordMeasurement();
    this.initialWordsPlaced = false;
    this.rightEdge = window.innerWidth; // Start at viewport right edge
  }

  // Add this method to SuperShow class, after initializeState()
  initializeConfiguration() {
    const settings = this.timingController?.getSettings() || {
      minFontSize: 1.5,
      maxFontSize: 10,
      margin: 5,
      bubblePadding: 5
    };

    Object.assign(this, settings);
  }

  initializeViewport() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.gridCells = 20;
    this.cellHeight = this.viewportHeight / this.gridCells;
  }

  async initializeComponents() {
    this.container = document.querySelector('.display-container');
    this.wordStream = document.getElementById('word-stream');

    // Pass timing controller to components that need it
    this.wordPacker = new WordPacker(this.container, this.timingController);

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
  // SuperShow.js
  update(timestamp) {
    if (!this.isAnimating) return;

    if (this.timingController.shouldCreateWord(timestamp)) {
        this.createWord().then(word => {
            if (word) {
                word.style.display = 'none';
                this.wordStream.appendChild(word);
                word.offsetHeight;
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
      return null;
  }

  const element = this.wordCreator.createWord();
  if (element) {
    console.log('Creating word:', element.textContent);
    const metrics = await this.measureWord(element);

    if (!this.initialWordsPlaced) {
      // Fill phase - start at 0 and move left
      const x = this.wordBubbles.length * 20;  // Each word 20 units left
      element.style.setProperty('--x', `${x}px`);

      if (x >= window.innerWidth) {
        console.log('Reached left edge, switching to normal mode');
        this.initialWordsPlaced = true;
      }
    } else {
      // Normal mode - always at right edge (0)
      element.style.setProperty('--x', '0px');
    }

    element.style.setProperty('--y', `${10 + (Math.random() * 80)}%`);

    const bubble = this.createBubble(element, {
      x: window.innerWidth - parseFloat(element.style.getPropertyValue('--x')),
      y: element.style.getPropertyValue('--y')
    }, metrics);
    this.setupBubbleCleanup(element, bubble);

    return element;
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
    const minY = -100;
    const maxY = 200;
    const range = maxY - minY;
    const y = minY + (Math.random() * range);

    if (!this.initialWordsPlaced) {
      // Start from right viewport edge (0) and populate leftward
      const x = 0 - (this.wordBubbles.length * 20); // Each word 20 units to the left

      // Once we've filled to left edge
      if (x <= -150) {
        this.initialWordsPlaced = true;
      }

      return { x, y };
    }

    // After initial fill, always place at right edge (0)
    return { x: 0, y };
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

  updateBubblePositions() {
    this.wordBubbles.forEach(bubble => {
      const transform = new WebKitCSSMatrix(window.getComputedStyle(bubble.element).transform);
      bubble.x = transform.e;
    });
  }

  // Periodic cleanup
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

    // Add periodic cleanup every 5 seconds
    if (timestamp % 5000 < 16) {
        this.cleanupOccupiedSpaces();
    }

    this.animationFrame = requestAnimationFrame(this.update.bind(this));
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
    this.initialWordsPlaced = false;  // Reset this flag when starting
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
      // Remove event listeners before clearing
      Array.from(this.wordStream.children).forEach(word => {
        const listeners = word.getEventListeners?.('animationend') || [];
        listeners.forEach(listener => {
          word.removeEventListener('animationend', listener.listener);
        });
      });
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
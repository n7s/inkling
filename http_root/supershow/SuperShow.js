// =============================================================================
// SuperShow.js - Font animation system with tight packing
// =============================================================================

import { FontLoader } from '../core/FontLoader.js';
import { DragAndDrop } from '../shared/DragAndDrop.js';
import { UIControls } from '../shared/UIControls.js';

class SuperShow {
  constructor() {
    // Core state
    this.fonts = [];
    this.words = [];
    this.isAnimating = false;

    // Configuration
    this.minFontSize = 1.5;
    this.maxFontSize = 10;
    this.wordInterval = 50;
    this.lastWordTime = 0;
    this.margin = 5;

    // Viewport and grid configuration
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.gridCells = 20;
    this.cellHeight = this.viewportHeight / this.gridCells;

    // Bubble tracking
    this.wordBubbles = [];
    this.bubblePadding = 10;

    // Text measurement
    this.measuringCanvas = document.createElement('canvas');
    this.ctx = this.measuringCanvas.getContext('2d');

    // DOM elements
    this.container = document.querySelector('.display-container');
    this.wordStream = document.getElementById('word-stream');

    // Initialize components
    this.uiControls = new UIControls();

    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: this.handleFontDrop.bind(this)
    });

    // Set up resize handler
    window.addEventListener('resize', () => {
      this.viewportWidth = window.innerWidth;
      this.viewportHeight = window.innerHeight;
      this.cellHeight = this.viewportHeight / this.gridCells;
    });

    // Animation frame
    this.animationFrame = null;

    // Load words
    this.loadWordList();
  }

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

  measureWord(text, fontFamily, fontSize) {
    // Set up canvas for measurement
    this.ctx.font = `${fontSize}vh ${fontFamily}`;
    const metrics = this.ctx.measureText(text);

    // Get the full height including ascenders and descenders
    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    return {
      width: metrics.width,
      height: height,
      baseline: metrics.actualBoundingBoxAscent
    };
  }

  findNextPosition(wordWidth, wordHeight, baseline) {
    const containerHeight = this.wordStream.offsetHeight;
    const containerWidth = this.wordStream.offsetWidth;

    // If current line is too full, start a new line
    if (this.currentLine.xOffset + wordWidth + this.margin > containerWidth) {
      this.currentLine.y += this.currentLine.height + this.margin;
      this.currentLine.xOffset = 0;
      this.currentLine.height = 0;

      // If we've filled the container height, reset to top
      if (this.currentLine.y > containerHeight) {
        this.currentLine.y = 0;
      }
    }

    // Store current position
    const position = {
      x: this.currentLine.xOffset,
      y: this.currentLine.y + baseline
    };

    // Update line tracking
    this.currentLine.xOffset += wordWidth + this.margin;
    this.currentLine.height = Math.max(this.currentLine.height, wordHeight);

    return position;
  }

  createWord() {
    const word = this.words[Math.floor(Math.random() * this.words.length)];
    const font = this.fonts[Math.floor(Math.random() * this.fonts.length)];

    // Create element
    const element = document.createElement('div');
    element.className = 'stream-word';
    element.textContent = this.transformCase(word);

    // Determine size
    const sizeRand = Math.random();
    let fontSize;
    if (sizeRand < 0.4) {       // 40% very small
      fontSize = this.minFontSize + (this.maxFontSize - this.minFontSize) * 0.2;
    } else if (sizeRand < 0.7) { // 30% small
      fontSize = this.minFontSize + (this.maxFontSize - this.minFontSize) * 0.4;
    } else if (sizeRand < 0.9) { // 20% medium
      fontSize = this.minFontSize + (this.maxFontSize - this.minFontSize) * 0.6;
    } else {                    // 10% large
      fontSize = this.maxFontSize;
    }

    element.style.fontSize = `${fontSize}vh`;
    element.style.fontFamily = `"${font.fontFamily}"`;

    if (this.foregroundColor) {
      element.style.color = this.foregroundColor;
    }

    // Measure the word's dimensions
    const metrics = this.measureWord(element.textContent, font.fontFamily, fontSize);

    // Find position for the word
    const position = this.findAvailablePosition(metrics);
    if (position) {
      element.style.setProperty('--y', `${position.y}vh`);

      // Create and store bubble
      const bubble = {
        x: position.x,
        y: position.y * (this.viewportHeight / 100),  // Convert vh to pixels
        width: metrics.width + (this.bubblePadding * 2),
        height: metrics.height + (this.bubblePadding * 2),
        element: element
      };

      this.wordBubbles.push(bubble);

      // Remove bubble after animation
      element.addEventListener('animationend', () => {
        const index = this.wordBubbles.findIndex(b => b.element === element);
        if (index !== -1) {
          this.wordBubbles.splice(index, 1);
        }
        element.remove();
      }, { once: true });
    }

    return element;
  }

  findAvailablePosition(metrics) {
    const bubbleWidth = metrics.width + (this.bubblePadding * 2);
    const bubbleHeight = metrics.height + (this.bubblePadding * 2);

    // Try positions through the grid
    for (let attempts = 0; attempts < 50; attempts++) {
      // Try random position
      const y = Math.random() * 100;  // Full viewport height in vh units
      const x = this.viewportWidth;   // Start at right edge

      // Check for collisions
      const hasCollision = this.wordBubbles.some(bubble => {
        return this.checkBubbleCollision(
          { x, y: y * (this.viewportHeight / 100), width: bubbleWidth, height: bubbleHeight },
          bubble
        );
      });

      if (!hasCollision) {
        return { x, y };
      }
    }

    return null;
  }

  checkBubbleCollision(bubble1, bubble2) {
    return !(
      bubble1.x + bubble1.width < bubble2.x - this.bubblePadding ||
      bubble1.x - this.bubblePadding > bubble2.x + bubble2.width ||
      bubble1.y + bubble1.height < bubble2.y - this.bubblePadding ||
      bubble1.y - this.bubblePadding > bubble2.y + bubble2.height
    );
  }


  update(timestamp) {
    if (!this.isAnimating) return;

    // Update bubble positions based on animation
    this.wordBubbles.forEach(bubble => {
      const transform = new WebKitCSSMatrix(window.getComputedStyle(bubble.element).transform);
      bubble.x = transform.e;
    });

    // Create new words if needed
    if (timestamp - this.lastWordTime > this.wordInterval) {
      const word = this.createWord();
      if (word) {
        this.wordStream.appendChild(word);
        this.lastWordTime = timestamp;
      }
    }

    this.animationFrame = requestAnimationFrame(this.update.bind(this));
  }

  cleanupOccupiedSpaces() {
    // Remove any spaces that are no longer needed
    const now = Date.now();
    this.occupiedSpaces.forEach(pos => {
      const rect = document.elementFromPoint(window.innerWidth - 10, pos * window.innerHeight / 100);
      if (!rect || !rect.classList.contains('stream-word')) {
        this.occupiedSpaces.delete(pos);
      }
    });
  }

  transformCase(word) {
    const random = Math.random();
    if (random < 0.1) return word.toUpperCase();
    if (random < 0.3) return word.charAt(0).toUpperCase() + word.slice(1);
    return word;
  }

  start() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.lastWordTime = 0;
    this.currentLine = { y: 0, height: 0, xOffset: 0 };  // Reset line tracking
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
    this.currentLine = { y: 0, height: 0, xOffset: 0 };  // Reset line tracking
  }

  async handleFontDrop(buffer, filename) {
    try {
      const fontData = await this.fontLoader.loadFont(buffer, filename);
      this.fonts.push(fontData);

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

  setColors(foreground, background) {
    this.foregroundColor = foreground;
    if (this.container) {
      this.container.style.backgroundColor = background;
    }
    // Update existing words
    const words = this.wordStream.querySelectorAll('.stream-word');
    words.forEach(word => {
      word.style.color = foreground;
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SuperShow();
});

export { SuperShow };
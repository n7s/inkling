// =============================================================================
// WordPacker.js - CSS-first word packing system
// =============================================================================

import { WordMeasurement } from './WordMeasurement.js';

export class WordPacker {
  constructor(container) {
    this.container = container;
    this.boxes = new Map();  // word element -> bounding box

    // Configuration
    this.margin = 20;        // pixels between words
    this.maxWords = 100;     // reduced from 200 for better performance
    this.scanInterval = 100; // increased from 16ms for better performance
    this.lastScanTime = 0;

    // Performance monitoring
    this.lastPerformanceLog = 0;
    this.performanceInterval = 1000;

    // Measure word dimensions
    this.wordMeasurement = new WordMeasurement();
  }

  async addWord(wordElement) {
    if (this.boxes.size >= this.maxWords) return false;

    const measurements = await this.wordMeasurement.measureWord(wordElement);
    const position = this.findSpaceForWord(measurements);

    if (position) {
      wordElement.style.setProperty('--y', `${position.y}vh`);
      this.container.appendChild(wordElement);

      this.boxes.set(wordElement, {
        top: position.y,
        bottom: position.y + measurements.heightVh,
        heightVh: measurements.heightVh,
        element: wordElement
      });

      return true;
    }

    return false;
  }

  initialize() {
    console.log('Initializing WordPacker');
    this.clear();
    this.initializeViewportBounds();
  }

  clear() {
    this.boxes.clear();
    this.container.innerHTML = '';
  }

  initializeViewportBounds() {
    const height = window.innerHeight;
    // Track viewport in vh units to match CSS
    this.viewportBounds = {
      top: 0,
      bottom: 100, // 100vh
      height: 100  // 100vh
    };
  }

  needsWords() {
    return this.boxes.size < this.maxWords;
  }

  addWord(wordElement) {
    if (this.boxes.size >= this.maxWords) return false;

    const box = this.measureWord(wordElement);
    const position = this.findSpaceForWord(box);

    if (position) {
      // Set the CSS variable for animation
      wordElement.style.setProperty('--y', `${position.y}vh`);
      this.container.appendChild(wordElement);

      // Store box in vh units
      this.boxes.set(wordElement, {
        top: position.y,
        bottom: position.y + (box.heightVh),
        heightVh: box.heightVh,
        element: wordElement
      });

      return true;
    }

    return false;
  }

  measureWord(wordElement) {
    // Measure word size while hidden
    const tempDiv = wordElement.cloneNode(true);
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    document.body.appendChild(tempDiv);
    const rect = tempDiv.getBoundingClientRect();
    document.body.removeChild(tempDiv);

    // Convert measurements to vh units
    const heightVh = (rect.height / window.innerHeight) * 100;
    const marginVh = (this.margin / window.innerHeight) * 100;

    return {
      heightVh: heightVh + (marginVh * 2),
      element: wordElement
    };
  }

  findSpaceForWord(box) {
    const maxAttempts = 20;
    const minY = 0;
    const maxY = this.viewportBounds.height - box.heightVh;

    // Try random positions across the entire viewport
    for (let i = 0; i < maxAttempts; i++) {
      // Use full viewport range for placement
      const y = Math.random() * maxY;

      if (!this.checkCollisions(y, box.heightVh)) {
        return { y };
      }
    }

    return null;
  }

  checkCollisions(y, height) {
    const testBox = {
      top: y,
      bottom: y + height
    };

    // Check against all active boxes instead of just recent ones
    return Array.from(this.boxes.values()).some(existingBox =>
      !(testBox.bottom < existingBox.top || testBox.top > existingBox.bottom)
    );
  }

  update() {
    const now = performance.now();

    // Only update at specified interval
    if (now - this.lastScanTime < this.scanInterval) return;
    this.lastScanTime = now;

    // Log performance if needed
    if (now - this.lastPerformanceLog > this.performanceInterval) {
      console.log(`WordPacker stats: ${this.boxes.size} words active`);
      this.lastPerformanceLog = now;
    }

    // Remove words after animation ends
    this.removeFinishedWords();
  }

  removeFinishedWords() {
    for (const [element, box] of this.boxes.entries()) {
      // Check if element is done animating (has moved off screen)
      if (!element.parentNode) {
        this.boxes.delete(element);
      }
    }
  }
}
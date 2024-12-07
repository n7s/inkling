// =============================================================================
// WordPacker.js - CSS-first word packing system
// =============================================================================

import { WordMeasurement } from './WordMeasurement.js';

export class WordPacker {
  constructor(container, timingController) {
    this.container = container;
    this.timingController = timingController;
    this.boxes = new Map();
    const settings = timingController.getSettings();
    this.margin = 5;
    this.maxWords = settings.maxWords;
    this.wordMeasurement = new WordMeasurement();

    this.viewportBounds = {
      top: 10,
      bottom: 90,
      height: 80
    };

    // Add cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupRemovedWords(), 1000);

    // Initialize performance tracking
    this.lastScanTime = performance.now();
    this.lastPerformanceLog = performance.now();
    this.performanceInterval = 5000; // Log every 5 seconds
  }

  cleanupRemovedWords() {
    let cleaned = 0;
    for (const [element, box] of this.boxes.entries()) {
      if (!element.parentNode) {
        this.boxes.delete(element);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} finished words`);
    }
  }

  async addWord(wordElement) {
    // Clean up before adding new word
    this.cleanupRemovedWords();

    if (this.boxes.size >= this.maxWords) {
      console.log('Max words reached:', this.maxWords);
      return false;
    }

    const measurements = await this.wordMeasurement.queueMeasurement(wordElement);
    if (!measurements) {
      console.log('Failed to get measurements');
      return false;
    }

    const heightVh = measurements.heightVh;
    const box = {
      heightVh: heightVh,
      widthVh: measurements.widthVh
    };

    const position = this.findSpaceForWord(box);
    if (position) {
      const yPos = this.viewportBounds.top + position.y;
      wordElement.style.setProperty('--y', `${yPos}vh`);

      // Add animation end cleanup
      wordElement.addEventListener('animationend', () => {
        this.boxes.delete(wordElement);
        wordElement.remove();
      });

      this.container.appendChild(wordElement);

      this.boxes.set(wordElement, {
        top: yPos,
        bottom: yPos + heightVh,
        heightVh: heightVh,
        element: wordElement
      });

      return true;
    }

    return false;
  }

  findSpaceForWord(box) {
    const maxAttempts = 50;
    const usableHeight = this.viewportBounds.height - box.heightVh;

    if (usableHeight <= 0) {
      return null;
    }

    // Try to find non-colliding position with better distribution
    const sectionHeight = usableHeight / 10; // Divide viewport into 10 sections
    for (let i = 0; i < maxAttempts; i++) {
      // Try different sections of the viewport
      const section = Math.floor(i / 5) % 10; // Change section every 5 attempts
      const baseY = section * sectionHeight;
      const y = baseY + (Math.random() * sectionHeight);

      if (!this.checkCollisions(y, box.heightVh)) {
        return { y };
      }
    }

    return null;
  }

  checkCollisions(y, height) {
    const testBox = {
      top: this.viewportBounds.top + y,
      bottom: this.viewportBounds.top + y + height + this.margin // Add margin to prevent tight packing
    };

    return Array.from(this.boxes.values()).some(existingBox => {
      return !(testBox.bottom < existingBox.top - this.margin ||
               testBox.top > existingBox.bottom + this.margin);
    });
  }

  update() {
    const now = performance.now();

    // Log performance if needed
    if (now - this.lastPerformanceLog > this.performanceInterval) {
      console.log(`WordPacker stats: ${this.boxes.size} words active`);
      this.lastPerformanceLog = now;
    }

    // Clean up finished words
    this.cleanupRemovedWords();
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.boxes.clear();
  }
}
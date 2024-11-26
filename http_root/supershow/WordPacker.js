// =============================================================================
// WordPacker.js - Optimized word packing system
// =============================================================================

export class WordPacker {
  constructor(container) {
    this.container = container;
    this.boxes = new Map();  // word element -> bounding box

    // Configuration
    this.margin = 20;        // pixels between words
    this.maxWords = 100;     // reduced from 200 for better performance
    this.scanInterval = 100; // increased from 16ms for better performance
    this.lastScanTime = 0;
    this.viewportPadding = window.innerWidth / 2;  // reduced padding for better performance

    // Performance monitoring
    this.lastPerformanceLog = 0;
    this.performanceInterval = 1000; // Log performance every second
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
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.viewportBounds = {
      left: -this.viewportPadding,
      right: width + this.viewportPadding,
      top: 0,
      bottom: height,
      width: width + (this.viewportPadding * 2),
      height: height
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
      box.x = position.x;
      box.y = position.y;
      this.placeWord(wordElement, box);
      return true;
    }

    return false;
  }

  measureWord(wordElement) {
    // Measure word size efficiently
    const tempDiv = wordElement.cloneNode(true);
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    document.body.appendChild(tempDiv);
    const rect = tempDiv.getBoundingClientRect();
    document.body.removeChild(tempDiv);

    return {
      width: rect.width + (this.margin * 2),
      height: rect.height + (this.margin * 2),
      element: wordElement
    };
  }

  findSpaceForWord(box) {
    // Try to place word at entry edge first
    const entryX = this.viewportBounds.left;
    const maxAttempts = 10;  // Reduced attempts for better performance

    for (let i = 0; i < maxAttempts; i++) {
      const y = Math.random() * (this.viewportBounds.height - box.height);
      const testPosition = { x: entryX, y };

      if (!this.checkCollisionsAt(box, testPosition)) {
        return testPosition;
      }
    }

    return null;
  }

  checkCollisionsAt(box, position) {
    const testBox = {
      left: position.x,
      right: position.x + box.width,
      top: position.y,
      bottom: position.y + box.height
    };

    for (const existingBox of this.boxes.values()) {
      if (this.boxesIntersect(testBox, existingBox)) {
        return true;
      }
    }

    return false;
  }

  boxesIntersect(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  placeWord(wordElement, box) {
    wordElement.style.transform = `translate(${box.x}px, ${box.y}px)`;
    this.container.appendChild(wordElement);
    this.boxes.set(wordElement, {
      left: box.x,
      right: box.x + box.width,
      top: box.y,
      bottom: box.y + box.height,
      element: wordElement
    });
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

    // Remove out-of-bounds words
    this.removeOutOfBoundsWords();
  }

  removeOutOfBoundsWords() {
    for (const [element, box] of this.boxes.entries()) {
      const transform = new WebKitCSSMatrix(window.getComputedStyle(element).transform);
      const currentX = transform.e;

      // Only check x position for performance
      if (currentX > this.viewportBounds.right) {
        element.remove();
        this.boxes.delete(element);
      } else {
        // Update box position
        box.left = currentX;
        box.right = currentX + (box.right - box.left);
      }
    }
  }
}
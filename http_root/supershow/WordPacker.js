// =============================================================================
// WordPacker.js - Box-based word packing system
// =============================================================================

export class WordPacker {
  constructor(container) {
    this.container = container;
    this.boxes = new Map();  // word element -> bounding box

    // Configuration
    this.margin = 10;        // pixels between words
    this.maxWords = 200;     // maximum words on screen
    this.scanInterval = 16;  // ms between space scans
    this.lastScanTime = 0;
    this.viewportPadding = 200;  // pixels outside viewport
  }

  initialize() {
    this.clear();
    this.boxes.clear();
    this.placeInitialWords();
  }

  clear() {
    this.boxes.clear();
    this.container.innerHTML = '';
  }

  needsWords() {
    return this.boxes.size < this.maxWords;
  }

  getExtendedViewportBounds() {
    return {
      left: -this.viewportPadding,
      top: -this.viewportPadding,
      right: window.innerWidth + this.viewportPadding,
      bottom: window.innerHeight + this.viewportPadding,
      width: window.innerWidth + this.viewportPadding * 2,
      height: window.innerHeight + this.viewportPadding * 2
    };
  }

  placeInitialWords() {
    const bounds = this.getExtendedViewportBounds();
    const initialCount = Math.min(20, this.maxWords);

    // Create placeholder boxes for initial placement
    const initialBoxes = Array.from({ length: initialCount }, () => ({
      width: 100 + Math.random() * 200,   // Approximate word sizes
      height: 30 + Math.random() * 50,
      placed: false
    }));

    // Try to place each box
    initialBoxes.forEach(box => {
      for (let attempts = 0; attempts < 50 && !box.placed; attempts++) {
        box.x = bounds.left + Math.random() * bounds.width;
        box.y = bounds.top + Math.random() * bounds.height;

        if (!this.checkCollisions(box)) {
          box.placed = true;
        }
      }
    });

    // Store successfully placed boxes
    this.initialBoxes = initialBoxes.filter(box => box.placed);
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
    const tempDiv = wordElement.cloneNode(true);
    document.body.appendChild(tempDiv);
    const rect = tempDiv.getBoundingClientRect();
    document.body.removeChild(tempDiv);

    return {
      width: rect.width + this.margin * 2,
      height: rect.height + this.margin * 2,
      element: wordElement
    };
  }

  findSpaceForWord(box) {
    const bounds = this.getExtendedViewportBounds();

    // Try initial placement at entry edge
    for (let attempts = 0; attempts < 50; attempts++) {
      const x = bounds.left;
      const y = bounds.top + Math.random() * bounds.height;

      const testBox = { ...box, x, y };
      if (!this.checkCollisions(testBox)) {
        return { x, y };
      }
    }

    // If entry edge is full, try filling gaps
    return this.findGapForWord(box);
  }

  findGapForWord(box) {
    const bounds = this.getExtendedViewportBounds();
    const gridSize = 100;  // Size of grid to check for spaces

    for (let x = bounds.left; x < bounds.right; x += gridSize) {
      for (let y = bounds.top; y < bounds.bottom; y += gridSize) {
        const testBox = { ...box, x, y };
        if (!this.checkCollisions(testBox)) {
          return { x, y };
        }
      }
    }

    return null;
  }

  checkCollisions(newBox) {
    for (const box of this.boxes.values()) {
      if (this.boxesIntersect(newBox, box)) {
        return true;
      }
    }
    return false;
  }

  boxesIntersect(a, b) {
    return !(
      a.x + a.width < b.x - this.margin ||
      a.x > b.x + b.width + this.margin ||
      a.y + a.height < b.y - this.margin ||
      a.y > b.y + b.height + this.margin
    );
  }

  placeWord(wordElement, box) {
    wordElement.style.transform = `translate(${box.x}px, ${box.y}px)`;
    this.container.appendChild(wordElement);
    this.boxes.set(wordElement, box);
  }

  update() {
    const now = performance.now();
    if (now - this.lastScanTime < this.scanInterval) return;
    this.lastScanTime = now;

    // Remove words that have moved out of bounds
    this.removeOutOfBoundsWords();

    // Update positions of remaining words
    for (const [element, box] of this.boxes.entries()) {
      const transform = new WebKitCSSMatrix(window.getComputedStyle(element).transform);
      box.x = transform.e;
      box.y = transform.f;
    }
  }

  removeOutOfBoundsWords() {
    const bounds = this.getExtendedViewportBounds();

    for (const [element, box] of this.boxes.entries()) {
      if (box.x + box.width < bounds.left ||
          box.x > bounds.right ||
          box.y + box.height < bounds.top ||
          box.y > bounds.bottom) {
        element.remove();
        this.boxes.delete(element);
      }
    }
  }
}
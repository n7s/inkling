// =============================================================================
// SuperShow.js - Performance optimized font animation system
// =============================================================================

import { FontLoader } from '../core/FontLoader.js';
import { DragAndDrop } from '../shared/DragAndDrop.js';
import { UIControls } from '../shared/UIControls.js';
import { OpenTypeFeatures } from '../wordmaster/OpenTypeFeatures.js';

class QuadTree {
  constructor(bounds, capacity) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  subdivide() {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;

    this.northwest = new QuadTree({x: x, y: y, width: w, height: h}, this.capacity);
    this.northeast = new QuadTree({x: x + w, y: y, width: w, height: h}, this.capacity);
    this.southwest = new QuadTree({x: x, y: y + h, width: w, height: h}, this.capacity);
    this.southeast = new QuadTree({x: x + w, y: y + h, width: w, height: h}, this.capacity);

    this.divided = true;
  }

  insert(point) {
    if (!this.contains(point)) return false;

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northwest.insert(point) ||
      this.northeast.insert(point) ||
      this.southwest.insert(point) ||
      this.southeast.insert(point)
    );
  }

  retrieve(range) {
    let found = [];

    if (!this.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      if (this.intersects(range)) {
        found.push(point);
      }
    }

    if (this.divided) {
      found = found.concat(
        this.northwest.retrieve(range),
        this.northeast.retrieve(range),
        this.southwest.retrieve(range),
        this.southeast.retrieve(range)
      );
    }

    return found;
  }

  contains(point) {
    return (
      point.x >= this.bounds.x &&
      point.x < this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y < this.bounds.y + this.bounds.height
    );
  }

  intersects(range) {
    return !(
      range.x > this.bounds.x + this.bounds.width ||
      range.x + range.width < this.bounds.x ||
      range.y > this.bounds.y + this.bounds.height ||
      range.y + range.height < this.bounds.y
    );
  }

  clear() {
    this.points = [];
    if (this.divided) {
      this.northwest = null;
      this.northeast = null;
      this.southwest = null;
      this.southeast = null;
      this.divided = false;
    }
  }

  remove(point) {
    const index = this.points.indexOf(point);
    if (index > -1) {
      this.points.splice(index, 1);
      return true;
    }
    return false;
  }
}

class SuperShow {
  constructor() {
    // Configuration
    this.fonts = [];
    this.words = [];
    this.isAnimating = false;
    this.container = document.querySelector('.display-container');
    this.wordStream = document.getElementById('word-stream');
    this.currentSpeed = 10;
    this.currentAngle = 90;
    this.animationFrame = null;

    // Initialize color tracking
    this.foregroundColor = null;
    this.backgroundColor = null;

    // Layout configuration
    this.boundaryPadding = 50;
    this.minFontSize = 2;
    this.maxFontSize = 15;
    this.wordCount = 0;
    this.maxWords = 200;

    // Initialize components
    this.uiControls = new UIControls();
    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: this.handleFontDrop.bind(this)
    });

    // Initialize features
    this.setupEventListeners();
    this.loadWordList();
    this.initQuadtree();
  }

  initQuadtree() {
    const bounds = {
      x: -window.innerWidth,
      y: -window.innerHeight,
      width: window.innerWidth * 3,
      height: window.innerHeight * 3
    };

    this.quadtree = new QuadTree(bounds, 10);
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

  setupEventListeners() {
    // Animation speed control
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.querySelector('.speed-value');
    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', (e) => {
        this.currentSpeed = parseInt(e.target.value);
        speedValue.textContent = this.currentSpeed;
      });
    }

    // Rotation control
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValue = rotationSlider?.parentElement.querySelector('.value');
    if (rotationSlider && rotationValue) {
      rotationSlider.addEventListener('input', (e) => {
        this.currentAngle = parseInt(e.target.value);
        rotationValue.textContent = `${this.currentAngle}°`;
        this.updateRotation();
      });
    }

    // Color controls
    const foregroundSelect = document.getElementById('foreground-color');
    const backgroundSelect = document.getElementById('background-color');
    const swapButton = document.getElementById('background-toggle');

    if (foregroundSelect && backgroundSelect && swapButton) {
      // Initial colors
      this.foregroundColor = foregroundSelect.value;
      this.backgroundColor = backgroundSelect.value;

      // Color select handlers
      foregroundSelect.addEventListener('change', () => {
        this.foregroundColor = foregroundSelect.value;
        this.updateWordColors();
      });

      backgroundSelect.addEventListener('change', () => {
        this.backgroundColor = backgroundSelect.value;
        this.updateBackground();
      });

      // Swap button handler
      swapButton.addEventListener('click', () => {
        const currentFgColor = this.foregroundColor;
        const currentBgColor = this.backgroundColor;

        // Swap internal color state
        this.foregroundColor = currentBgColor;
        this.backgroundColor = currentFgColor;

        // Update dropdowns
        for(let i = 0; i < foregroundSelect.options.length; i++) {
          if(foregroundSelect.options[i].value === this.foregroundColor) {
            foregroundSelect.selectedIndex = i;
          }
        }

        for(let i = 0; i < backgroundSelect.options.length; i++) {
          if(backgroundSelect.options[i].value === this.backgroundColor) {
            backgroundSelect.selectedIndex = i;
          }
        }

        // Apply changes
        this.updateWordColors();
        this.updateBackground();
      });
    }

    // Font info toggle
    const fontInfoToggle = document.getElementById('font-info-toggle');
    const fontInfo = document.getElementById('font-info');
    if (fontInfoToggle && fontInfo) {
      fontInfoToggle.addEventListener('click', () => {
        const isVisible = fontInfo.style.display !== 'none';
        fontInfo.style.display = isVisible ? 'none' : 'block';
        fontInfoToggle.textContent = isVisible ? 'Show font info' : 'Hide font info';
      });
    }

    // Reset button
    const resetButton = document.getElementById('reset-animation');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (this.isAnimating) {
          this.stop();
          this.startAnimation();
        }
      });
    }

    // Fullscreen button and keyboard shortcut
    const fullscreenButton = document.querySelector('#fullScreen button');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        this.uiControls.toggleFullscreen();
      });
    }

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
      if (event.key === 'f') {
        this.uiControls.toggleFullscreen();
      }
    });
  }

  updateWordColors() {
    if (!this.foregroundColor) return;
    const wordElements = document.querySelectorAll('.stream-word');
    wordElements.forEach(element => {
      element.style.color = this.foregroundColor;
    });
  }

  updateBackground() {
    if (!this.backgroundColor) return;
    if (this.container) {
      this.container.style.backgroundColor = this.backgroundColor;
    }
  }

  updateRotation() {
    if (this.wordStream) {
      this.wordStream.style.transform = `rotate(${this.currentAngle}deg)`;
    }
  }

  createWord() {
    const element = document.createElement('div');
    element.className = 'stream-word';

    // Random word and case transformation
    const word = this.words[Math.floor(Math.random() * this.words.length)];
    element.textContent = this.transformCase(word);

    // Random size
    const size = this.minFontSize + Math.random() * (this.maxFontSize - this.minFontSize);
    element.style.fontSize = `${size}vh`;

    // Apply current color
    if (this.foregroundColor) {
      element.style.color = this.foregroundColor;
    }

    if (this.fonts.length > 0) {
      const font = this.fonts[Math.floor(Math.random() * this.fonts.length)];

      // Apply font family
      element.style.fontFamily = `"${font.fontFamily}"`;

      // Apply OpenType features (SMCP and stylistic sets only)
      if (font.features) {
        const availableFeatures = font.features.filter(f =>
          f === 'smcp' || f.startsWith('ss')
        );

        if (availableFeatures.length > 0) {
          const feature = availableFeatures[Math.floor(Math.random() * availableFeatures.length)];
          element.style.fontFeatureSettings = `"${feature}" 1`;
        }
      }

      // Apply variable font settings
      if (font.axes && font.axes.length > 0) {
        const settings = font.axes.map(axis => {
          const range = axis.max - axis.min;
          const randomValue = axis.min + (Math.random() * range);
          return `"${axis.tag}" ${randomValue.toFixed(2)}`;
        }).join(', ');

        element.style.fontVariationSettings = settings;
      }
    }

    return element;
  }

  transformCase(word) {
    const random = Math.random();
    if (random < 0.1) return word.toUpperCase();
    if (random < 0.3) return word.charAt(0).toUpperCase() + word.slice(1);
    return word;
  }

  findSpaceForWord(element) {
    const tempDiv = element.cloneNode(true);
    document.body.appendChild(tempDiv);
    const rect = tempDiv.getBoundingClientRect();
    document.body.removeChild(tempDiv);

    const padding = this.boundaryPadding;
    const bounds = {
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    };

    // Try positions until we find a space
    for (let attempts = 0; attempts < 50; attempts++) {
      const x = -window.innerWidth + Math.random() * (window.innerWidth * 3);
      const y = -window.innerHeight + Math.random() * (window.innerHeight * 3);

      const searchBounds = {
        x: x - padding,
        y: y - padding,
        width: bounds.width,
        height: bounds.height
      };

      const collisions = this.quadtree.retrieve(searchBounds);
      if (collisions.length === 0) {
        this.quadtree.insert(searchBounds);
        element.bounds = searchBounds; // Store bounds for later removal
        return { x, y };
      }
    }

    return null;
  }

  startAnimation() {
    if (!this.wordStream) return;

    this.stop();
    this.isAnimating = true;
    this.wordCount = 0;

    // Set initial rotation
    this.updateRotation();

    // Initial word creation
    this.createWords();

    // Start animation loop
    this.animate();
  }

  createWords() {
    while (this.wordCount < this.maxWords) {
      const word = this.createWord();
      const position = this.findSpaceForWord(word);

      if (position) {
        word.style.transform = `translate(${position.x}px, ${position.y}px)`;
        this.wordStream.appendChild(word);
        this.wordCount++;
      } else {
        break;
      }
    }
  }

  // Animate method
  animate() {
    if (!this.isAnimating) return;

    // Always move "right" (along baseline) relative to rotated container
    const dx = this.currentSpeed;
    const dy = 0;  // No vertical movement in container space

    // Move existing words
    const words = Array.from(this.wordStream.children);
    words.forEach(word => {
      const transform = new WebKitCSSMatrix(window.getComputedStyle(word).transform);
      const newX = transform.e + dx;
      const newY = transform.f + dy;

      word.style.transform = `translate(${newX}px, ${newY}px)`;

      // Update quadtree position
      if (word.bounds) {
        word.bounds.x += dx;
        word.bounds.y += dy;
      }

      // Remove if out of bounds
      const rect = word.getBoundingClientRect();
      if (this.isOutOfBounds(rect)) {
        if (word.bounds) {
          this.quadtree.remove(word.bounds);
        }
        word.remove();
        this.wordCount--;
      }
    });

    // Create new words if needed
    if (this.wordCount < this.maxWords) {
      this.createWords();
    }

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  // Update the updateRotation method to handle the container rotation
  updateRotation() {
    if (this.wordStream) {
      this.wordStream.style.transform = `rotate(${this.currentAngle}deg)`;

      // Update the quadtree bounds when rotation changes
      this.initQuadtree();
    }
  }

  isOutOfBounds(rect) {
    const margin = Math.max(window.innerWidth, window.innerHeight);
    return (
      rect.right < -margin ||
      rect.left > window.innerWidth + margin ||
      rect.bottom < -margin ||
      rect.top > window.innerHeight + margin
    );
  }

  async handleFontDrop(buffer, filename) {
    try {
      // Create OpenType features instance for this font
      const features = new OpenTypeFeatures();

      // Load the font
      const fontData = await this.fontLoader.loadFont(buffer, filename);

      // Extract features and axes
      const availableFeatures = features.extractFeatures(fontData.fontInfo);

      // Create complete font object
      const completeFontData = {
        ...fontData,
        features: Array.from(availableFeatures),
        axes: fontData.fontInfo.axes || []
      };

      // Add to fonts array
      this.fonts.push(completeFontData);

      // Start animation if this is the first font
      if (this.fonts.length === 1) {
        this.startAnimation();
      }
    } catch (error) {
      console.error('Error loading font:', error);
      alert('Error loading font file');
    }
  }

  handleFontLoaded(fontData) {
    console.log('Font loaded:', fontData.fontFamily);
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
    this.quadtree.clear();
    this.wordCount = 0;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SuperShow();
});

export { SuperShow };
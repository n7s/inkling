// =============================================================================
// SuperShow.js - Font animation system
// =============================================================================

import { FontLoader } from '../core/FontLoader.js';
import { DragAndDrop } from '../shared/DragAndDrop.js';
import { UIControls } from '../shared/UIControls.js';
import { OpenTypeFeatures } from '../wordmaster/OpenTypeFeatures.js';

class SuperShow {
  constructor() {
    // Configuration
    this.fonts = [];
    this.words = [];
    this.lines = [];
    this.lineCount = 10;
    this.wordsPerLine = 5;
    this.isAnimating = false;
    this.container = document.querySelector('.display-container');
    this.wordStream = document.getElementById('word-stream');
    this.currentSpeed = 10;
    this.currentAngle = 90;

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
    const speedSlider = document.querySelector('.slider-container:nth-child(2) input');
    const speedValue = document.querySelector('.slider-container:nth-child(2) .value');
    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', (e) => {
        this.currentSpeed = parseInt(e.target.value);
        speedValue.textContent = `${this.currentSpeed}ms`;
        this.updateAnimation();
      });
    }

    // Rotation control
    const angleSlider = document.querySelector('.slider-container:nth-child(3) input');
    const angleValue = document.querySelector('.slider-container:nth-child(3) .value');
    if (angleSlider && angleValue) {
      angleSlider.addEventListener('input', (e) => {
        this.currentAngle = parseInt(e.target.value);
        angleValue.textContent = `${this.currentAngle}°`;
        this.updateRotation();
      });
    }

    // Color swap button
    const swapButton = document.querySelector('.buttons-container button:nth-child(2)');
    if (swapButton) {
      swapButton.addEventListener('click', () => {
        this.uiControls.toggleColorScheme();
      });
    }

    // Fullscreen button
    const fullscreenButton = document.querySelector('#fullScreen button');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        this.uiControls.toggleFullscreen();
      });
    }
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
    // This is now just a callback hook if needed
    // All font processing is done in handleFontDrop
    console.log('Font loaded:', fontData.fontFamily);
  }

  createWordElement() {
    const word = this.words[Math.floor(Math.random() * this.words.length)];
    const font = this.fonts[Math.floor(Math.random() * this.fonts.length)];

    const element = document.createElement('span');
    element.className = 'stream-word';
    element.textContent = this.transformCase(word);

    if (font) {
      // Apply font family
      element.style.fontFamily = `"${font.fontFamily}"`;

      // Apply random OpenType feature if available
      if (font.features && font.features.length > 0) {
        const randomFeature = font.features[Math.floor(Math.random() * font.features.length)];
        element.style.fontFeatureSettings = `"${randomFeature}" 1`;
      }

      // Apply random variable font settings if available
      if (font.axes && font.axes.length > 0) {
        const settings = font.axes.map(axis => {
          const range = axis.max - axis.min;
          const randomValue = axis.min + (Math.random() * range);
          return `"${axis.tag}" ${randomValue.toFixed(2)}`;
        });
        element.style.fontVariationSettings = settings.join(', ');
      }
    }

    return element;
  }

  transformCase(word) {
    const random = Math.random();
    if (random < 0.1) {
      return word.toUpperCase();
    } else if (random < 0.3) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }

  createLine() {
    const line = document.createElement('div');
    line.className = 'word-stream-line';

    // Randomize vertical position
    const randomTop = Math.random() * 100;
    line.style.top = `${randomTop}%`;

    // Add words to line
    for (let i = 0; i < this.wordsPerLine; i++) {
      line.appendChild(this.createWordElement());
    }

    return line;
  }

  startAnimation() {
    if (!this.wordStream) return;

    this.isAnimating = true;
    this.lines = [];

    // Create initial lines
    for (let i = 0; i < this.lineCount; i++) {
      const line = this.createLine();
      this.wordStream.appendChild(line);
      this.lines.push(line);

      // Set animation
      line.style.animation = `moveAcross ${20 - this.currentSpeed}s linear infinite`;
    }

    // Start line regeneration cycle
    this.regenerateLines();
  }

  regenerateLines() {
    if (!this.isAnimating) return;

    setInterval(() => {
      this.lines.forEach(line => {
        // Check if line has moved off screen
        const rect = line.getBoundingClientRect();
        if (rect.right < 0 || rect.left > window.innerWidth) {
          // Remove old line
          line.remove();

          // Create and add new line
          const newLine = this.createLine();
          this.wordStream.appendChild(newLine);
          newLine.style.animation = `moveAcross ${20 - this.currentSpeed}s linear infinite`;

          // Update lines array
          const index = this.lines.indexOf(line);
          if (index !== -1) {
            this.lines[index] = newLine;
          }
        }
      });
    }, 1000);
  }

  updateAnimation() {
    this.lines.forEach(line => {
      line.style.animation = `moveAcross ${20 - this.currentSpeed}s linear infinite`;
    });
  }

  updateRotation() {
    if (this.wordStream) {
      this.wordStream.style.transform = `rotate(${this.currentAngle}deg)`;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SuperShow();
});

export { SuperShow };
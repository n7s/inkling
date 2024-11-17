// =============================================================================
// galleyproof/GalleyProof.js
// =============================================================================

import { DragAndDrop } from '../shared/DragAndDrop.js';
import { FontLoader } from '../core/FontLoader.js';
import { UIControls } from '../shared/UIControls.js';
import { FontInfoRenderer } from '../core/FontInfo.js';
import { OpenTypeFeatures } from '../wordmaster/OpenTypeFeatures.js';
import { VariationAxes } from '../hyperflip/VariationAxes.js';

class GalleyProof {
  constructor() {
    this.container = document.getElementById('galley');
    if (this.container) {
      this.container.style.width = '100%';
      this.container.style.height = '100%';
      this.container.style.position = 'relative';
      this.container.style.overflow = 'auto';
      this.container.style.scrollbarWidth = 'none';
      this.container.style.msOverflowStyle = 'none';
      this.container.style.display = 'flex';
      this.container.style.justifyContent = 'center';
    }

    this.textContent = '';
    this.currentVariationSettings = 'normal';

    this.openTypeFeatures = new OpenTypeFeatures();
    this.uiControls = new UIControls();

    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: (buffer, filename) => {
        this.fontLoader.loadFont(buffer, filename);
      }
    });

    this.variationAxes = new VariationAxes({
      container: document.getElementById('controls'),
      onChange: (settings) => {
        if (this.container.firstChild) {
          this.currentVariationSettings = settings;
          this.container.firstChild.style.fontVariationSettings = settings;
        }
      }
    });

    this.setupEventListeners();
    this.loadText();
    this.initializeSliders();
  }

  initializeSliders() {
    const sliders = document.querySelectorAll('.slider-container');

    // Font size slider
    const sizeContainer = sliders[0];
    const sizeSlider = sizeContainer?.querySelector('input[type="range"]');
    const sizeValue = sizeContainer?.querySelector('.value');

    if (sizeSlider) {
      sizeSlider.min = "0.3";
      sizeSlider.max = "8";
      sizeSlider.step = "0.1";
      const initialSize = 1;
      sizeSlider.value = initialSize.toString();

      if (sizeValue) {
        sizeValue.textContent = `${initialSize}rem`;
      }
    }

    sizeSlider?.addEventListener('input', (e) => {
      const fontSize = parseFloat(e.target.value);
      if (sizeValue) {
        sizeValue.textContent = `${fontSize}rem`;
      }
      if (this.container.firstChild) {
        this.container.firstChild.style.fontSize = `${fontSize}rem`;
      }
    });

    // Leading slider
    const leadingContainer = sliders[1];
    const leadingSlider = leadingContainer?.querySelector('input[type="range"]');
    const leadingValue = leadingContainer?.querySelector('.value');

    if (leadingSlider) {
      leadingSlider.min = "0.5";
      leadingSlider.max = "4";
      leadingSlider.step = "0.1";
      const initialLeading = 1.5;
      leadingSlider.value = initialLeading.toString();

      if (leadingValue) {
        leadingValue.textContent = `${initialLeading}×`;
      }
    }

    leadingSlider?.addEventListener('input', (e) => {
      const leading = parseFloat(e.target.value);
      if (leadingValue) {
        leadingValue.textContent = `${leading}×`;
      }
      if (this.container.firstChild) {
        this.container.firstChild.style.lineHeight = leading;
      }
    });

    // Column width slider
    const widthContainer = sliders[2];
    const widthSlider = widthContainer?.querySelector('input[type="range"]');
    const widthValue = widthContainer?.querySelector('.value');

    if (widthSlider) {
      widthSlider.min = "20";
      widthSlider.max = "100";
      const initialWidth = 60;
      widthSlider.value = initialWidth.toString();

      if (widthValue) {
        widthValue.textContent = `${initialWidth}%`;
      }
    }

    widthSlider?.addEventListener('input', (e) => {
      const width = parseInt(e.target.value);
      if (widthValue) {
        widthValue.textContent = `${width}%`;
      }
      if (this.container.firstChild) {
        this.container.firstChild.style.width = `${width}%`;
      }
    });
  }

  setupEventListeners() {
    // Fullscreen button
    const fullscreenButton = document.querySelector('#fullScreen button');
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => {
        this.uiControls.toggleFullscreen();
        fullscreenButton.textContent = document.fullscreenElement ? 'Windowed' : 'Fullscreen';
      });
    }

    // Font info toggle
    const fontInfoToggle = document.getElementById('font-info-toggle');
    const fontInfo = document.getElementById('font-info');
    fontInfoToggle?.addEventListener('click', () => {
      if (!fontInfo) return;
      const isVisible = fontInfo.style.display !== 'none';
      fontInfo.style.display = isVisible ? 'none' : 'block';
      if (fontInfoToggle) {
        fontInfoToggle.textContent = isVisible ? 'Show font info' : 'Hide font info';
      }
    });

    // Background toggle
    document.getElementById('background-toggle')?.addEventListener('click', () => {
      this.uiControls.toggleColorScheme();
    });

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
      if (event.key === 'f') {
        this.uiControls.toggleFullscreen();
        const fullscreenButton = document.querySelector('#fullScreen button');
        if (fullscreenButton) {
          fullscreenButton.textContent = document.fullscreenElement ? 'Windowed' : 'Fullscreen';
        }
      }
    });
  }

  async loadText() {
    try {
      const response = await fetch('../word_lists/kongens_fald.txt');
      this.textContent = await response.text();
    } catch (error) {
      console.error('Error loading text:', error);
      this.textContent = 'Error loading text. Please ensure kongens_fald.txt is available.';
    }
  }

  handleFontLoaded({ font, fontInfo, fontFamily }) {
    FontInfoRenderer.renderFontInfo(
      document.getElementById('font-info-content'),
      fontInfo
    );

    // Create text container if it doesn't exist
    if (!this.container.firstChild) {
      const textElement = document.createElement('div');
      textElement.style.whiteSpace = 'pre-wrap';
      textElement.style.width = '60%';
      textElement.style.fontSize = '1rem';
      textElement.style.lineHeight = '1.5';
      textElement.style.fontFamily = `"${fontFamily}"`;
      textElement.style.fontVariationSettings = this.currentVariationSettings;
      textElement.textContent = this.textContent;

      this.container.appendChild(textElement);
    } else {
      this.container.firstChild.style.fontFamily = `"${fontFamily}"`;
    }

    // Extract and set up OpenType features
    this.openTypeFeatures.clear();
    this.openTypeFeatures.extractFeatures(fontInfo);
    this.openTypeFeatures.createButtons();

    // Create axis controls if font has variable axes
    if (fontInfo.axes) {
      this.variationAxes.createAxesControls(fontInfo.axes);
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new GalleyProof();
});

export { GalleyProof };
// =============================================================================
// wordmaster/WordAnimator.js
// =============================================================================

import { FontLoader } from '../core/FontLoader.js';
import { FontInfoRenderer } from '../core/FontInfo.js';
import { MetricsOverlay } from '../hyperflip/MetricsOverlay.js';
import { VariationAxes } from '../hyperflip/VariationAxes.js';
import { UIControls } from '../shared/UIControls.js';
import { DragAndDrop } from '../shared/DragAndDrop.js';
import { TextFitter } from './TextFitter.js';

export class WordAnimator {
  constructor(options) {
    this.container = document.getElementById('word');
    this.wordList = [];
    this.features = options?.features || [];
    this.animationInterval = null;
    this.currentFeature = null;
    this.currentVariationSettings = 'normal';
    this.horizontalPadding = 40;

    this.uiControls = new UIControls();

    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: (buffer, filename) => this.fontLoader.loadFont(buffer, filename)
    });

    this.metricsOverlay = new MetricsOverlay();
    this.textFitter = new TextFitter({ padding: this.horizontalPadding });

    this.setupEventListeners();
    this.loadWordList();

    window.addEventListener('resize', () => {
      if (this.container.firstChild) {
        this.textFitter.fitText(this.container.firstChild, this.container);
      }
    });

    // Initialize VariationAxes
    this.variationAxes = new VariationAxes({
      container: document.getElementById('controls'),
      onChange: (settings) => {
        if (this.container.firstChild) {
          this.currentVariationSettings = settings;
          this.container.firstChild.style.fontVariationSettings = settings;
        }
      }
    });

    // Initialize sliders
    const sliders = document.querySelectorAll('.slider-container');

    // Font size slider (controls horizontal padding)
    const sizeContainer = sliders[0];
    const sizeSlider = sizeContainer.querySelector('input[type="range"]');
    sizeSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.horizontalPadding = val;
      this.textFitter.padding = val;
      if (this.container.firstChild) {
        this.textFitter.fitText(this.container.firstChild, document.querySelector('.display-container'));
      }
    });

    // Animation delay slider
    const delayContainer = sliders[1];
    const delaySlider = delayContainer?.querySelector('input[type="range"]');
    const delayValue = delayContainer?.querySelector('.value');
    delaySlider?.addEventListener('input', (e) => {
      const delay = e.target.value;
      if (delayValue) {
        delayValue.textContent = delay + 'ms';
      }
      this.stop();
      this.start(parseInt(delay));
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

    // OpenType features toggle
    const featureToggle = document.getElementById('font-opentype-features');
    const featureInfo = document.getElementById('feature-info');
    featureToggle?.addEventListener('click', () => {
      if (!featureInfo) return;
      const isVisible = getComputedStyle(featureInfo).display !== 'none';
      featureInfo.style.display = isVisible ? 'none' : 'block';
      if (featureToggle) {
        featureToggle.textContent = isVisible ? 'Show features' : 'Hide features';
      }
    });

    // Metrics toggle
    const metricsToggle = document.getElementById('metrics-toggle');
    const metricsOverlay = document.getElementById('font-metrics-overlay');
    metricsToggle?.addEventListener('click', () => {
      this.metricsOverlay.toggle();
      if (metricsToggle && metricsOverlay) {
        const isVisible = getComputedStyle(metricsOverlay).display !== 'none';
        metricsToggle.textContent = isVisible ? 'Hide metrics' : 'Show metrics';
      }
    });

    // Background toggle
    document.getElementById('background-toggle')?.addEventListener('click', () => {
      this.uiControls.toggleColorScheme();
    });

    // Keyboard controls
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  handleKeyPress(event) {
    switch(event.key) {
      case ' ':
        event.preventDefault();
        if (this.animationInterval) {
          this.stop();
        } else {
          const delaySlider = document.querySelector('.slider-container:nth-child(2) input[type="range"]');
          this.start(parseInt(delaySlider?.value || 3000));
        }
        break;
      case 'f':
        this.uiControls.toggleFullscreen();
        const fullscreenButton = document.querySelector('#fullScreen button');
        if (fullscreenButton) {
          fullscreenButton.textContent = document.fullscreenElement ? 'Windowed' : 'Fullscreen';
        }
        break;
    }
  }

  async loadWordList() {
    try {
      const response = await fetch('../word_lists/synthetic_words.txt');
      const text = await response.text();
      this.wordList = text.split('\n').filter(word => word.trim());
    } catch (error) {
      console.error('Error loading word list:', error);
      this.wordList = ['OpenType', 'Features', 'Typography', 'Design'];
    }
  }

  handleFontLoaded({ font, fontInfo, fontFamily }) {
    FontInfoRenderer.renderFontInfo(
      document.getElementById('font-info-content'),
      fontInfo
    );

    this.container.style.fontFamily = `"${fontFamily}"`;

    // Create axis controls if font has variable axes
    if (fontInfo.axes) {
      this.variationAxes.createAxesControls(fontInfo.axes);
    }

    this.start();
  }

  async start(interval = 3000) {
    if (this.wordList.length === 0) {
      await this.loadWordList();
    }
    this.updateWord();
    this.animationInterval = setInterval(() => this.updateWord(), interval);
  }

  stop() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  updateWord() {
    if (this.wordList.length === 0) return;

    this.container.classList.add('fade-out');

    setTimeout(() => {
      const word = this.getRandomWord();
      const wordElement = document.createElement('div');
      wordElement.textContent = word;
      wordElement.style.whiteSpace = 'nowrap';

      if (this.features.length > 0) {
        const feature = this.getRandomFeature();
        wordElement.style.fontFeatureSettings = `"${feature}" 1`;
        this.currentFeature = feature;
      }

      // Apply current variation settings before adding to DOM
      wordElement.style.fontVariationSettings = this.currentVariationSettings;

      this.container.innerHTML = '';
      this.container.appendChild(wordElement);

      // Fit text using current horizontal padding
      this.textFitter.fitText(wordElement, document.querySelector('.display-container'));

      this.container.classList.remove('fade-out');
    }, 300);
  }

  getRandomWord() {
    return this.wordList[Math.floor(Math.random() * this.wordList.length)];
  }

  getRandomFeature() {
    return this.features[Math.floor(Math.random() * this.features.length)];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WordAnimator();
});
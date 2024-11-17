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

    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,
      onDrop: (buffer, filename) => this.fontLoader.loadFont(buffer, filename)
    });

    this.uiControls = new UIControls();
    this.textFitter = new TextFitter({ padding: 40 });

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

  setupEventListeners() {
    document.getElementById('font-info-toggle')?.addEventListener('click', () => {
      const fontInfo = document.getElementById('font-info');
      fontInfo.style.display = fontInfo.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('font-opentype-features')?.addEventListener('click', () => {
      const featureInfo = document.getElementById('feature-info');
      featureInfo.style.display = featureInfo.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('metrics-toggle')?.addEventListener('click', () => {
      const metricsOverlay = document.getElementById('font-metrics-overlay');
      metricsOverlay.style.display = metricsOverlay.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('background-toggle')?.addEventListener('click', () => {
      this.uiControls.toggleColorScheme();
    });
  }

  handleFontLoaded({ font, fontInfo, fontFamily }) {
    FontInfoRenderer.renderFontInfo(
      document.getElementById('font-info-content'),
      fontInfo
    );

    this.container.style.fontFamily = fontFamily;

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

      // Fit text only after applying all settings
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
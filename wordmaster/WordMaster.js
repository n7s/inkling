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

    this.fontLoader = new FontLoader({
      onFontLoaded: this.handleFontLoaded.bind(this)
    });

    this.dragAndDrop = new DragAndDrop({
      dropZone: document.body,  // Changed from dropZone to document.body
      onDrop: (buffer, filename) => this.fontLoader.loadFont(buffer, filename)
    });

    this.uiControls = new UIControls();
    this.textFitter = new TextFitter();

    this.setupEventListeners();
    this.loadWordList();
  }

  /**
   * Loads word list from external file
   * @private
   */
  async loadWordList() {
    try {
      const response = await fetch('../word_lists/synthetic_words.txt');
      const text = await response.text();
      this.wordList = text.split('\n').filter(word => word.trim());
    } catch (error) {
      console.error('Error loading word list:', error);
      // Fallback to some default words if loading fails
      this.wordList = ['OpenType', 'Features', 'Typography', 'Design'];
    }
  }

  /**
   * Sets up event listeners for UI controls
   * @private
   */
  setupEventListeners() {
    document.getElementById('font-info-toggle')?.addEventListener('click', () => {
      const fontInfo = document.getElementById('font-info');
      fontInfo.style.display = fontInfo.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('features-toggle')?.addEventListener('click', () => {
      const featureInfo = document.getElementById('feature-info');
      featureInfo.style.display = featureInfo.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('color-toggle')?.addEventListener('click', () => {
      this.uiControls.toggleColorScheme();
    });
  }

  /**
   * Handles font loading completion
   * @private
   */
  handleFontLoaded({ font, fontInfo, fontFamily }) {
    FontInfoRenderer.renderFontInfo(
      document.getElementById('font-info-content'),
      fontInfo
    );

    this.container.style.fontFamily = fontFamily;
    this.start();
  }

  /**
   * Starts word animation
   * @param {number} interval - Animation interval in milliseconds
   */
  async start(interval = 3000) {
    // Make sure words are loaded before starting animation
    if (this.wordList.length === 0) {
      await this.loadWordList();
    }
    this.updateWord();
    this.animationInterval = setInterval(() => this.updateWord(), interval);
  }

  /**
   * Stops word animation
   */
  stop() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  /**
   * Updates displayed word with random feature
   * @private
   */
  updateWord() {
    if (this.wordList.length === 0) return;

    this.container.classList.add('fade-out');

    setTimeout(() => {
      const word = this.getRandomWord();
      const wordElement = document.createElement('div');
      wordElement.textContent = word;

      if (this.features.length > 0) {
        const feature = this.getRandomFeature();
        wordElement.style.fontFeatureSettings = `"${feature}" 1`;
        this.currentFeature = feature;
      }

      this.container.innerHTML = '';
      this.container.appendChild(wordElement);
      this.container.classList.remove('fade-out');

      // Fit text to container
      this.textFitter.fitText(wordElement, this.container);
    }, 300);
  }

  /**
   * Gets a random word from the word list
   * @private
   */
  getRandomWord() {
    return this.wordList[Math.floor(Math.random() * this.wordList.length)];
  }

  /**
   * Gets a random OpenType feature
   * @private
   */
  getRandomFeature() {
    return this.features[Math.floor(Math.random() * this.features.length)];
  }
}

// Initialize the WordAnimator when the document loads
document.addEventListener('DOMContentLoaded', () => {
  new WordAnimator();
});
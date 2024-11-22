// =============================================================================
// WordCreator.js - Word creation and styling management
// =============================================================================

import { OpenTypeFeatures } from '../wordmaster/OpenTypeFeatures.js';

export class WordCreator {
  constructor() {
    this.words = [];
    this.fonts = [];
    this.foregroundColor = null;
    this.backgroundColor = null;

    // Font size limits in vh units
    this.minFontSize = 2;
    this.maxFontSize = 15;

    // Text case probabilities
    this.caseTransformations = {
      uppercase: 0.1,    // 10% chance
      capitalize: 0.3,   // 20% additional chance
      lowercase: 0.6     // remaining 70%
    };
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

  addFont(fontData) {
    // Extract OpenType features
    const features = new OpenTypeFeatures();
    const availableFeatures = features.extractFeatures(fontData.fontInfo);

    // Create complete font object with features
    const font = {
      ...fontData,
      features: Array.from(availableFeatures).filter(f =>
        f === 'smcp' || f.startsWith('ss')  // Only keep small caps and stylistic sets
      ),
      axes: fontData.fontInfo.axes || []
    };

    this.fonts.push(font);
  }

  setColors(foreground, background) {
    this.foregroundColor = foreground;
    this.backgroundColor = background;
  }

  createWord() {
    const element = document.createElement('div');
    element.className = 'stream-word';

    // Apply text content and case transformation
    const word = this.getRandomWord();
    element.textContent = this.transformCase(word);

    // Apply styling
    this.applyRandomSize(element);
    this.applyColor(element);
    this.applyRandomFont(element);

    return element;
  }

  getRandomWord() {
    return this.words[Math.floor(Math.random() * this.words.length)];
  }

  transformCase(word) {
    const random = Math.random();
    if (random < this.caseTransformations.uppercase) {
      return word.toUpperCase();
    } else if (random < this.caseTransformations.uppercase + this.caseTransformations.capitalize) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  }

  applyRandomSize(element) {
    const size = this.minFontSize + Math.random() * (this.maxFontSize - this.minFontSize);
    element.style.fontSize = `${size}vh`;
  }

  applyColor(element) {
    if (this.foregroundColor) {
      element.style.color = this.foregroundColor;
    }
  }

  applyRandomFont(element) {
    if (this.fonts.length === 0) return;

    const font = this.fonts[Math.floor(Math.random() * this.fonts.length)];

    // Apply font family
    element.style.fontFamily = `"${font.fontFamily}"`;

    // Randomly apply OpenType feature if available
    if (font.features && font.features.length > 0) {
      if (Math.random() < 0.3) {  // 30% chance to apply a feature
        const feature = font.features[Math.floor(Math.random() * font.features.length)];
        element.style.fontFeatureSettings = `"${feature}" 1`;
      }
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
}
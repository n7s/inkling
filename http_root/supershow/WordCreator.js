// =============================================================================
// WordCreator.js - Word creation and styling management
// =============================================================================

import { OpenTypeFeatures } from '../wordmaster/OpenTypeFeatures.js';

export class WordCreator {
  constructor() {
    this.words = ['Typography']; // Default word to use until list is loaded
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

    // Define variable font axis defaults and ranges
    this.variableAxes = {
      'wdth': { normal: 100, min: 88, max: 113 },     // Match font's actual range
      'wght': { normal: 400, min: 360, max: 900 },    // Match font's actual range
      'opsz': { normal: 12, min: 5, max: 1200 }       // Match font's actual range
    };
  }

  // Box-Muller transform for generating normally distributed random numbers
  gaussianRandom() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // Map gaussian random number to a range with normal value as center
  mapGaussianToRange(normal, min, max) {
    // Get a random number from normal distribution (mostly between -3 and 3)
    const gaussian = this.gaussianRandom();

    // Determine which side of normal we're on
    if (gaussian > 0) {
      // Map positive gaussian to range between normal and max
      return normal + (gaussian / 3) * (max - normal);
    } else {
      // Map negative gaussian to range between min and normal
      return normal + (gaussian / 3) * (normal - min);
    }
  }

  // Get random variation settings for a font
  getRandomVariationSettings(font) {
    if (!font.axes || font.axes.length === 0) {
      console.log('No axes available for font:', font.fontFamily);
      return '';
    }

    const settings = [];
    console.log('Getting variation settings for axes:', font.axes);

    for (const axis of font.axes) {
      const axisConfig = this.variableAxes[axis.tag];
      if (axisConfig) {
        // Get normally distributed value for this axis
        let value = this.mapGaussianToRange(
          axisConfig.normal,
          Math.max(axis.min, axisConfig.min),
          Math.min(axis.max, axisConfig.max)
        );

        // Clamp value to axis bounds
        value = Math.max(axis.min, Math.min(axis.max, value));

        // Round to 2 decimal places
        value = Math.round(value * 100) / 100;

        settings.push(`"${axis.tag}" ${value}`);
        console.log(`Generated setting for ${axis.tag}:`, value);
      }
    }

    const result = settings.join(', ');
    console.log('Final variation settings:', result);
    return result;
  }

  async loadWordList() {
    try {
      const response = await fetch('../word_lists/euro_words.txt');
      const text = await response.text();
      const words = text.split('\n').filter(word => word.trim());
      if (words.length > 0) {
        this.words = words;
        console.log(`Loaded ${words.length} words`);
      } else {
        console.warn('Word list was empty, using default words');
        this.words = ['Typography', 'Design', 'Letters', 'Words'];
      }
    } catch (error) {
      console.error('Error loading word list:', error);
      this.words = ['Typography', 'Design', 'Letters', 'Words'];
    }
  }

  addFont(fontData) {
    console.log('Adding font with data:', fontData);

    // Extract OpenType features
    const features = new OpenTypeFeatures();
    const availableFeatures = features.extractFeatures(fontData.fontInfo);

    // Get axes from fontInfo
    const axes = fontData.fontInfo.axes || [];
    console.log('Font axes from fontInfo:', axes);

    // Create complete font object with features and axes
    const font = {
      ...fontData,
      features: Array.from(availableFeatures).filter(f =>
        f === 'smcp' || f.startsWith('ss')
      ),
      axes: axes
    };

    console.log('Created font object with axes:', {
      fontFamily: font.fontFamily,
      axesCount: font.axes.length,
      axes: font.axes
    });

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

    // Debug log to verify settings
    console.log('Created word:', {
      text: element.textContent,
      fontFamily: element.style.fontFamily,
      variationSettings: element.style.fontVariationSettings
    });

    return element;
  }

  getRandomWord() {
    if (!this.words || this.words.length === 0) {
      console.warn('No words available, using fallback');
      return 'Typography';
    }
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
    console.log('Applying font:', {
      family: font.fontFamily,
      hasAxes: !!font.axes,
      axesCount: font.axes?.length
    });

    // Apply font family
    element.style.fontFamily = `"${font.fontFamily}"`;

    // Apply variable font settings if available
    const variationSettings = this.getRandomVariationSettings(font);
    if (variationSettings) {
      element.style.fontVariationSettings = variationSettings;
      console.log('Applied variation settings:', {
        element: element.textContent,
        settings: variationSettings
      });
    }

    // Randomly apply OpenType feature if available
    if (font.features && font.features.length > 0) {
      if (Math.random() < 0.3) {  // 30% chance to apply a feature
        const feature = font.features[Math.floor(Math.random() * font.features.length)];
        element.style.fontFeatureSettings = `"${feature}" 1`;
      }
    }
  }
}
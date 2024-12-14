// =============================================================================
// SuperShowD3.js - D3-based word cloud implementation (D3 v7)
// =============================================================================

import { FontLoader } from '../core/FontLoader.js';
import { DragAndDrop } from '../shared/DragAndDrop.js';

export class SuperShowD3 {
  constructor() {
    this.words = [];
    this.fonts = [];
    this.foregroundColor = 'var(--color-black)';
    this.backgroundColor = 'var(--color-white)';
    this.rotationRange = 0;
    this.animationSpeed = 10;
    this.isAnimating = false;

    // Case transformation probabilities
    this.caseTransformations = {
      uppercase: 0.05,    // 5% chance
      capitalize: 0.10,   // 10% chance
      lowercase: 0.85     // 85% chance
    };

    // Variable font axis defaults and ranges
    this.variableAxes = {
      'wdth': { normal: 100, min: 88, max: 113 },
      'wght': { normal: 400, min: 360, max: 900 },
      'opsz': { normal: 12, min: 5, max: 1200 }
    };

    this.setupD3Cloud();
    this.initializeUI();
    this.setupFontHandling();
    this.loadWordList();
  }

  async loadWordList() {
    const fallbackWords = ['Typography', 'Design', 'Letters', 'Words'];

    try {
      const response = await fetch('/word_lists/euro_words.txt');
      if (!response.ok) {
        throw new Error('Failed to load word list');
      }

      const text = await response.text();
      this.words = text.split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0);

      if (this.words.length === 0) {
        console.warn('Word list was empty, using fallback words');
        this.words = fallbackWords;
      }
    } catch (error) {
      console.warn('Error loading word list:', error);
      this.words = fallbackWords;
    }

    if (this.fonts.length > 0) {
      this.updateCloud();
    }
  }

  setupD3Cloud() {
    // Make SVG larger than viewport to ensure edge-to-edge coverage
    const width = window.innerWidth * 1.5;
    const height = window.innerHeight * 1.5;

    // Clear any existing SVG
    d3.select('#word-cloud').selectAll('*').remove();

    this.svg = d3.select('#word-cloud')
      .append('svg')
      .attr('width', '150%')
      .attr('height', '150%')
      .style('position', 'absolute')
      .style('left', '-25%')
      .style('top', '-25%')
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

    // Create canvas for text measurements
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    this.layout = d3.layout.cloud()
      .size([width, height])
      .padding(15)
      .rotate(() => this.rotationRange ? (Math.random() * 2 - 1) * this.rotationRange : 0)
      .fontSize(d => d.size)
      .font(d => d.fontFamily)
      .spiral('archimedean')
      .text(d => d.text)
      .canvas(() => canvas);
  }

  gaussianRandom() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  mapGaussianToRange(normal, min, max) {
    const gaussian = this.gaussianRandom();
    if (gaussian > 0) {
      return normal + (gaussian / 3) * (max - normal);
    } else {
      return normal + (gaussian / 3) * (normal - min);
    }
  }

  transformCase(word) {
    // Check if word is already mixed case (not all lowercase)
    if (word !== word.toLowerCase()) {
      return word; // Keep original case
    }

    const random = Math.random();
    if (random < this.caseTransformations.uppercase) {
      return word.toUpperCase();
    } else if (random < this.caseTransformations.uppercase + this.caseTransformations.capitalize) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  }

  getRandomVariationSettings(font) {
    if (!font.axes || font.axes.length === 0) return '';

    const settings = [];
    for (const axis of font.axes) {
      const axisConfig = this.variableAxes[axis.tag];
      if (axisConfig) {
        const value = this.mapGaussianToRange(
          axisConfig.normal,
          Math.max(axis.min || axisConfig.min, axisConfig.min),
          Math.min(axis.max || axisConfig.max, axisConfig.max)
        );
        settings.push(`"${axis.tag}" ${Math.round(value)}`);
      }
    }
    return settings.join(', ');
  }

  setupFontHandling() {
    const fontLoader = new FontLoader({
      onFontLoaded: async (fontData) => {
        try {
          // Safely extract OpenType features with proper null checking
          let features = [];
          try {
            const gsubFeatures = fontData.font?.tables?.gsub?.features || {};
            features = Array.from(new Set(
              Object.keys(gsubFeatures)
            )).filter(f => f === 'smcp' || f.startsWith('ss'));
          } catch (e) {
            console.log('No GSUB features found in font');
            features = [];
          }

          // Safely get variable font axes
          let axes = [];
          try {
            axes = fontData.font?.tables?.fvar?.axes || [];
          } catch (e) {
            console.log('No variable font axes found');
            axes = [];
          }

          // Get the font name from OpenType.js structure
          const fontFamily = fontData.font?.names?.fontFamily ||
                           fontData.font?.names?.preferredFamily ||
                           fontData.font?.names?.fullName ||
                           fontData.font?.names?.postScriptName;

          if (!fontFamily) {
            throw new Error('Could not find font family name in font data');
          }

          // Store font data with safely extracted features and axes
          this.fonts.push({
            ...fontData,
            fontFamily: fontFamily,
            features: features,
            axes: axes
          });

          console.log('Processed font:', {
            fontFamily,
            featureCount: features.length,
            axesCount: axes.length
          });

          this.updateCloud();

        } catch (error) {
          console.error('Error processing font:', error);
        }
      }
    });

    new DragAndDrop({
      dropZone: document.body,
      onDrop: async (buffer, filename) => {
        try {
          const font = await opentype.parse(buffer);
          const fontFamily = font.names.fontFamily ||
                           font.names.preferredFamily ||
                           font.names.fullName ||
                           font.names.postScriptName;

          if (!fontFamily) {
            throw new Error('Could not find font family name');
          }

          const fontFace = new FontFace(fontFamily, buffer);
          await fontFace.load();
          document.fonts.add(fontFace);

          await fontLoader.loadFont(buffer, filename);

        } catch (error) {
          console.error('Error loading font:', error);
          alert('Error loading font file');
        }
      }
    });
  }

  updateCloud() {
    if (!this.words.length || !this.fonts.length) return;

    const width = window.innerWidth * 1.5;
    const height = window.innerHeight * 1.5;

    // Update SVG size for fullscreen
    d3.select(this.svg.node().parentNode)
      .attr('width', '150%')
      .attr('height', '150%');

    const processedWords = this.words
      .map(word => {
        const font = this.fonts[Math.floor(Math.random() * this.fonts.length)];
        const variationSettings = this.getRandomVariationSettings(font);

        // Apply case transformation
        const transformedText = this.transformCase(word);

        // Randomly apply OpenType features (10% chance)
        let fontFeatures = null;
        if (Math.random() < 0.1 && font.features && font.features.length > 0) {
          fontFeatures = font.features[Math.floor(Math.random() * font.features.length)];
        }

        const minSize = 14;
        const maxSize = Math.min(width, height) / 5;
        const size = minSize + Math.pow(Math.random(), 2) * (maxSize - minSize);

        return {
          text: transformedText,
          size: size,
          fontFamily: font.fontFamily,
          variationSettings: variationSettings,
          fontFeatures: fontFeatures
        };
      })
      .sort((a, b) => b.size - a.size)
      .slice(0, 120);

    this.layout
      .stop()
      .words(processedWords)
      .on('end', words => {
        // Remove all transitions, just update directly
        const texts = this.svg.selectAll('text')
          .data(words, d => d.text + d.fontFamily);

        // Remove old texts immediately
        texts.exit().remove();

        // Add new texts
        const textEnter = texts.enter()
          .append('text')
          .text(d => d.text)
          .style('font-family', d => `"${d.fontFamily}"`)
          .style('font-size', d => `${d.size}px`)
          .style('fill', this.foregroundColor)
          .attr('text-anchor', 'middle')
          .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`);

        // Apply font variations and features
        textEnter.each((d, i, nodes) => {
          const node = d3.select(nodes[i]);
          if (d.variationSettings) {
            node.style('font-variation-settings', d.variationSettings);
          }
          if (d.fontFeatures) {
            node.style('font-feature-settings', `"${d.fontFeatures}" 1`);
          }
        });

        // Update existing texts
        texts
          .style('font-family', d => `"${d.fontFamily}"`)
          .style('font-size', d => `${d.size}px`)
          .style('fill', this.foregroundColor)
          .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`);
      })
      .start();
  }


  initializeUI() {
    // Color controls
    document.getElementById('foreground-color').addEventListener('change', (e) => {
      this.foregroundColor = e.target.value;
      this.updateColors();
    });

    document.getElementById('background-color').addEventListener('change', (e) => {
      this.backgroundColor = e.target.value;
      this.updateColors();
    });

    // Color swap button
    document.getElementById('background-toggle').addEventListener('click', () => {
      [this.foregroundColor, this.backgroundColor] = [this.backgroundColor, this.foregroundColor];
      const fgSelect = document.getElementById('foreground-color');
      const bgSelect = document.getElementById('background-color');
      fgSelect.value = this.foregroundColor;
      bgSelect.value = this.backgroundColor;
      this.updateColors();
    });

    // Font info toggle
    document.getElementById('font-info-toggle').addEventListener('click', () => {
      const fontInfo = document.getElementById('font-info');
      const isVisible = fontInfo.style.display === 'block';
      fontInfo.style.display = isVisible ? 'none' : 'block';
      document.getElementById('font-info-toggle').textContent =
        isVisible ? 'Show font info' : 'Hide font info';
    });

    // Rotation control
    document.getElementById('rotation-slider').addEventListener('input', (e) => {
      this.rotationRange = parseInt(e.target.value);
      document.querySelector('#rotation-slider + .value').textContent = `${this.rotationRange}°`;
      this.updateCloud();
    });

    // Speed control
    document.getElementById('speed-slider').addEventListener('input', (e) => {
      this.animationSpeed = parseInt(e.target.value);
      document.querySelector('.speed-value').textContent = this.animationSpeed;
    });

    // Reset button
    document.getElementById('reset-animation').addEventListener('click', () => {
      this.updateCloud();
    });

    // Fullscreen handling
    const fullscreenBtn = document.querySelector('#fullScreen button');
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    });

    // Add resize handler
    window.addEventListener('resize', () => {
      this.setupD3Cloud();
      this.updateCloud();
    });
  }

  updateColors() {
    document.querySelector('.display-container').style.backgroundColor = this.backgroundColor;
    this.svg.selectAll('text')
      .style('fill', this.foregroundColor);
  }
}
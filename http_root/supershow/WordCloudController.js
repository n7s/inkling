// =============================================================================
// WordCloudController.js - Integrates WordCloudLayout with SuperShow system
// =============================================================================

import { WordMeasurement } from './WordMeasurement.js';

export class WordCloudController {
  constructor(container, options = {}) {
    this.container = container;
    this.wordMeasurement = new WordMeasurement();
    this.options = {
      width: window.innerWidth * 1.5,
      height: window.innerHeight,
      padding: 20,
      minFontSize: 14,
      maxFontSize: 80,
      rotationRange: [-30, 30],
      ...options
    };

    this.clouds = new Set();
    this.isAnimating = false;
    this.measureText = this.measureText.bind(this);
  }

  async createCloud() {
    const cloudElement = document.createElement('div');
    cloudElement.className = 'word-cloud';
    cloudElement.style.position = 'absolute';
    cloudElement.style.transform = 'translateX(100vw)';
    cloudElement.style.width = `${this.options.width}px`;
    cloudElement.style.height = '100%';

    const words = await this.generateStyledWords();
    const placedWords = new Set();

    for (const word of words) {
      const wordElement = document.createElement('div');
      wordElement.className = 'cloud-word';
      wordElement.textContent = word.text;
      wordElement.style.fontSize = `${word.size}px`;
      wordElement.style.fontFamily = word.fontFamily;
      wordElement.style.transform = `rotate(${word.rotate}deg)`;
      wordElement.style.color = this.options.foregroundColor;

      const metrics = await this.wordMeasurement.measureWord(wordElement);
      const position = this.findNonOverlappingPosition(placedWords, metrics);

      if (position) {
        wordElement.style.left = `${position.x}px`;
        wordElement.style.top = `${position.y}px`;
        cloudElement.appendChild(wordElement);

        placedWords.add({
          x: position.x,
          y: position.y,
          width: metrics.width + this.options.padding * 2,
          height: metrics.height + this.options.padding * 2
        });
      }
    }

    cloudElement.style.animation = 'moveRight var(--animation-duration) linear forwards';
    cloudElement.addEventListener('animationend', () => {
      cloudElement.remove();
      this.clouds.delete(cloudElement);
    });

    this.container.appendChild(cloudElement);
    this.clouds.add(cloudElement);

    return cloudElement;
  }

  findNonOverlappingPosition(placedWords, metrics) {
    const maxAttempts = 50;
    const padding = this.options.padding;

    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.random() * (this.options.width - metrics.width);
      const y = Math.random() * (this.options.height - metrics.height);

      let overlaps = false;
      for (const placed of placedWords) {
        if (this.checkOverlap(
          { x, y, width: metrics.width + padding * 2, height: metrics.height + padding * 2 },
          placed
        )) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) return { x, y };
    }
    return null;
  }

  checkOverlap(a, b) {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  async generateStyledWords() {
    if (!this.options.words?.length || !this.options.fonts?.length) {
      console.warn('No words or fonts available');
      return [];
    }

    const wordCount = 100;
    return Array.from({ length: wordCount }, () => ({
      text: this.options.words[Math.floor(Math.random() * this.options.words.length)],
      size: this.options.minFontSize + Math.random() * (this.options.maxFontSize - this.options.minFontSize),
      fontFamily: this.options.fonts[Math.floor(Math.random() * this.options.fonts.length)].fontFamily,
      rotate: this.options.rotationRange[0] + Math.random() * (this.options.rotationRange[1] - this.options.rotationRange[0])
    }));
  }

  start() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.createCloud();
    this.animate();
  }

  stop() {
    this.isAnimating = false;
    this.clouds.forEach(cloud => cloud.remove());
    this.clouds.clear();
  }

  animate() {
    if (!this.isAnimating) return;

    if (this.clouds.size < 2) {
      this.createCloud();
    }

    requestAnimationFrame(this.animate.bind(this));
  }

  async measureText(text, fontSize, fontFamily) {
    const element = document.createElement('div');
    element.style.fontSize = `${fontSize}px`;
    element.style.fontFamily = fontFamily;
    element.style.position = 'absolute';
    element.style.visibility = 'hidden';
    element.textContent = text;
    return this.wordMeasurement.measureWord(element);
  }

  setSpeed(speed) {
    document.documentElement.style.setProperty('--animation-duration', `${15 / speed}s`);
  }

  setColors(foreground, background) {
    this.options.foregroundColor = foreground;
    this.container.style.backgroundColor = background;
    this.clouds.forEach(cloud => {
      Array.from(cloud.getElementsByClassName('cloud-word')).forEach(word => {
        word.style.color = foreground;
      });
    });
  }
}
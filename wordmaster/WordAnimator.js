// =============================================================================
// wordmaster/WordAnimator.js
// =============================================================================

export class WordAnimator {
  /**
   * Creates a new WordAnimator instance
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element
   * @param {string[]} options.wordList - List of words to animate
   * @param {string[]} options.features - Available OpenType features
   */
  constructor(options) {
    this.container = options.container;
    this.wordList = options.wordList || [
      'Hello', 'World', 'OpenType', 'Features', 'Typography',
      'Design', 'Creative', 'Awesome', 'Beautiful', 'Elegant'
    ];
    this.features = options.features || [];
    this.animationInterval = null;
    this.currentFeature = null;
  }

  /**
   * Starts word animation
   * @param {number} interval - Animation interval in milliseconds
   */
  start(interval = 3000) {
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
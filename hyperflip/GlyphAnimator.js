// =============================================================================
// hyperflip/GlyphAnimator.js
// =============================================================================

export class GlyphAnimator {
  /**
   * Creates a new GlyphAnimator instance
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.displayElement - Element to show glyphs
   * @param {Function} options.onGlyphChange - Callback when glyph changes
   */
  constructor(options) {
    this.displayElement = options.displayElement;
    this.onGlyphChange = options.onGlyphChange;
    this.glyphs = [];
    this.currentIndex = 0;
    this.isAnimating = false;
    this.animationInterval = null;
    this.isRandomOrder = false;
  }

  /**
   * Sets the glyphs to animate
   * @param {string[]} glyphs - Array of glyphs
   */
  setGlyphs(glyphs) {
    this.glyphs = [...glyphs];
    this.sequentialGlyphs = [...glyphs];
    this.currentIndex = 0;
  }

  /**
   * Starts the animation
   * @param {number} interval - Animation interval in milliseconds
   */
  start(interval) {
    if (this.glyphs.length === 0) return;

    this.isAnimating = true;
    this.animate(interval);
  }

  /**
   * Stops the animation
   */
  stop() {
    this.isAnimating = false;
    if (this.animationInterval) {
      clearTimeout(this.animationInterval);
    }
  }

  /**
   * Toggles between random and sequential order
   */
  toggleOrder() {
    if (this.isRandomOrder) {
      this.glyphs = [...this.sequentialGlyphs];
    } else {
      this.glyphs = this.shuffleArray([...this.glyphs]);
    }
    this.isRandomOrder = !this.isRandomOrder;
    this.currentIndex = 0;
  }

  /**
   * Internal animation function
   * @private
   */
  animate(interval) {
    const nextFrame = () => {
      if (!this.isAnimating) return;

      const currentChar = this.glyphs[this.currentIndex];
      this.displayElement.textContent = currentChar;
      this.onGlyphChange?.(currentChar);

      this.currentIndex = (this.currentIndex + 1) % this.glyphs.length;
      this.animationInterval = setTimeout(() => nextFrame(), interval);
    };

    nextFrame();
  }

  /**
   * Shuffles an array
   * @private
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
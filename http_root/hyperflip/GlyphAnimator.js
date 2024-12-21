// =============================================================================
// hyperflip/GlyphAnimator.js
// =============================================================================

export class GlyphAnimator {
  constructor(options) {
    this.displayElement = options.displayElement;
    this.onGlyphChange = options.onGlyphChange;
    this.glyphs = [];
    this.sequentialGlyphs = [];
    this.currentIndex = 0;
    this.isAnimating = false;
    this.animationFrameId = null;
    this.isRandomOrder = false;

    // Animation timing variables
    this.lastFrameTime = 0;
    this.interval = 2000; // Default interval
  }

  async setGlyphsFromFont(font) {
    if (!font) {
      throw new Error('No font provided');
    }

    const chars = [];
    for (let i = 0; i < font.glyphs.length; i++) {
      const glyph = font.glyphs.get(i);
      if (glyph.name === '.notdef' || glyph.unicode === undefined) {
        continue;
      }
      const char = String.fromCodePoint(glyph.unicode);
      chars.push(char);
    }

    this.glyphs = chars;
    this.sequentialGlyphs = [...chars];
    this.currentIndex = 0;
  }

  start(interval) {
    if (this.glyphs.length === 0) {
      console.error('No glyphs available for animation');
      return;
    }

    this.interval = interval;
    this.isAnimating = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  stop() {
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  animate(currentTime = performance.now()) {
    if (!this.isAnimating) return;

    const elapsed = currentTime - this.lastFrameTime;

    if (elapsed >= this.interval) {
      // Update the glyph
      const currentChar = this.glyphs[this.currentIndex];
      this.displayElement.textContent = currentChar;
      this.onGlyphChange?.(currentChar);

      // Move to next glyph
      this.currentIndex = (this.currentIndex + 1) % this.glyphs.length;

      // Reset timer
      this.lastFrameTime = currentTime - (elapsed % this.interval);
    }

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  moveForward(steps = 1) {
    this.currentIndex = (this.currentIndex + steps) % this.glyphs.length;
    const currentChar = this.glyphs[this.currentIndex];
    this.displayElement.textContent = currentChar;
    this.onGlyphChange?.(currentChar);
  }

  moveBack(steps = 1) {
    this.currentIndex = (this.currentIndex - steps + this.glyphs.length) % this.glyphs.length;
    const currentChar = this.glyphs[this.currentIndex];
    this.displayElement.textContent = currentChar;
    this.onGlyphChange?.(currentChar);
  }

  toggleOrder() {
    if (this.isRandomOrder) {
      this.glyphs = [...this.sequentialGlyphs];
    } else {
      this.glyphs = this.shuffleArray([...this.glyphs]);
    }
    this.isRandomOrder = !this.isRandomOrder;
    this.currentIndex = 0;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

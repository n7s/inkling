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
    this.animationInterval = null;
    this.isRandomOrder = false;
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

    this.isAnimating = true;
    this.animate(interval);
  }

  stop() {
    this.isAnimating = false;
    if (this.animationInterval) {
      clearTimeout(this.animationInterval);
    }
  }

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
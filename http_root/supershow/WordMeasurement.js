// =============================================================================
// WordMeasurement.js - Accurate font and word measurement
// =============================================================================

export class WordMeasurement {
  constructor() {
    this.measurementCache = new Map();
    this.setupMeasurementContext();
    this.measurementQueue = Promise.resolve();
    this.loadingFonts = new Map();  // Add this line only
  }

  setupMeasurementContext() {
    // Create a permanent hidden measurement container
    this.measurementContainer = document.createElement('div');
    this.measurementContainer.style.cssText = `
      position: absolute;
      visibility: hidden;
      left: -9999px;
      top: -9999px;
      white-space: nowrap;
      pointer-events: none;
    `;
    document.body.appendChild(this.measurementContainer);
  }

  async measureWord(wordElement) {
    const key = this.getCacheKey(wordElement);
    if (this.measurementCache.has(key)) {
      return this.measurementCache.get(key);
    }

    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Measurement timeout')), 5000);
    });

    try {
      const result = await Promise.race([
        this._performMeasurement(wordElement),
        timeoutPromise
      ]);
      return result;
    } catch (error) {
      console.error('Measurement failed:', error);
      return null;
    }
  }

  // Move the measurement logic to a separate method
  async _performMeasurement(wordElement) {
    const clone = wordElement.cloneNode(true);
    this.measurementContainer.appendChild(clone);

    try {
      // Ensure all styles are applied including animations
      clone.style.cssText += wordElement.style.cssText;

      // Copy computed styles to ensure everything is captured
      const computedStyle = window.getComputedStyle(wordElement);
      for (const property of computedStyle) {
        clone.style[property] = computedStyle[property];
      }

      // Wait for font to load if needed
      const fontFamily = computedStyle.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      if (fontFamily && fontFamily !== '') {
        await this.ensureFontLoaded(fontFamily, wordElement);
      }

      // Force a layout recalculation
      clone.offsetHeight;

      // Get the measurements including any transforms
      const measurements = this.getMeasurementsWithTransforms(clone);

      // Cache the result
      this.measurementCache.set(this.getCacheKey(wordElement), measurements);

      return measurements;
    } finally {
      // Ensure clone is always removed
      clone.remove();
    }
  }

  async queueMeasurement(wordElement) {
    return new Promise((resolve) => {
      this.measurementQueue = this.measurementQueue.then(async () => {
        try {
          // Use existing measureWord method
          const measurements = await this.measureWord(wordElement);
          resolve(measurements);
        } catch (error) {
          console.error('Measurement error:', error);
          resolve(null);
        }
      });
    });
  }

  async ensureFontLoaded(fontFamily, element) {
    if (!fontFamily || this.loadingFonts.has(fontFamily)) {
      return this.loadingFonts.get(fontFamily);
    }

    const loadingPromise = new Promise(async (resolve) => {
      try {
        // Try loading with computed style settings
        const computedStyle = window.getComputedStyle(element);
        const fontWeight = computedStyle.fontWeight;
        const fontStyle = computedStyle.fontStyle;

        await document.fonts.load(`${fontWeight} ${fontStyle} 1em "${fontFamily}"`);
        // Add small delay for browser rendering
        await new Promise(r => setTimeout(r, 50));
        resolve(true);
      } catch (error) {
        console.warn(`Font loading failed for ${fontFamily}:`, error);
        resolve(false);
      }
    });

    this.loadingFonts.set(fontFamily, loadingPromise);
    return loadingPromise;
  }

  cleanupFontLoading(fontFamily) {
    if (fontFamily) {
      this.loadingFonts.delete(fontFamily);
    }
  }

  getMeasurementsWithTransforms(element) {
    // Get the raw bounding rect
    const rect = element.getBoundingClientRect();

    // Get the computed transform
    const transform = window.getComputedStyle(element).transform;
    const matrix = new DOMMatrix(transform);

    // Convert to vh units for consistent sizing
    const viewportHeight = window.innerHeight;
    const marginVh = (this.margin || 5) / viewportHeight * 100;

    return {
      width: rect.width,
      height: rect.height,
      heightVh: (rect.height / viewportHeight * 100) + (marginVh * 2),
      widthVh: (rect.width / viewportHeight * 100) + (marginVh * 2),
      boundingBox: {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left
      },
      transform: {
        matrix: matrix,
        rotation: Math.atan2(matrix.b, matrix.a) * (180 / Math.PI),
        scaleX: Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b),
        scaleY: Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d)
      }
    };
  }

  getCacheKey(element) {
    // Create a unique key based on the element's properties
    return JSON.stringify({
      text: element.textContent,
      font: element.style.fontFamily,
      size: element.style.fontSize,
      variation: element.style.fontVariationSettings,
      features: element.style.fontFeatureSettings
    });
  }

  clearOldCacheEntries() {
    const now = Date.now();
    for (const [key, value] of this.measurementCache.entries()) {
      if (now - value.timestamp > 60000) { // Clear entries older than 1 minute
        this.measurementCache.delete(key);
      }
    }
  }

  cleanup() {
    // First clear any ongoing measurements
    this.measurementQueue = Promise.resolve();

    // Clean up measurement elements
    if (this.measurementContainer) {
      // Remove all children first
      while (this.measurementContainer.firstChild) {
        this.measurementContainer.firstChild.remove();
      }
      // Then remove the container itself
      this.measurementContainer.remove();
      this.measurementContainer = null;
    }

    // Clear all caches
    this.measurementCache.clear();
    this.loadingFonts.clear();
  }
}